const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const os = require("os");
const path = require("path");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");
const UserModel = require("../model/userModel");
const CollaboratorModel = require("../model/collaboratorModel");

const createFolder = async (folderName, parentId) => {
  const service = google.drive({ version: "v3", auth });

  // Check if folder already exists
  try {
    const existingFolder = await service.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: "files(id, name)",
    });

    // If the folder exists, return a message
    if (existingFolder.data.files.length > 0) {
      const folder = existingFolder.data.files[0];
      console.log(`${folderName} folder name in ${parentId} already exists`);
      return folder.id;
    }

    // Proceed with creating a new folder if it doesn't exist
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    };
    const file = await service.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    const folderId = file.data.id;
    await service.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "writer",
        type: "user",
        emailAddress: process.env.COMPANY_EMAIL,
      },
    });

    return folderId;
  } catch (error) {
    console.error("Error creating or sharing folder:", error);
    throw error;
  }
};

// Function to create a folder inside 'users'
const createUsersFolder = async (folderName) => {
  return await createFolder(folderName, process.env.USERS_ROOT_DIRECTORY);
};

// Function to create a folder inside 'chats'
const createChatsFolder = async (folderName) => {
  return await createFolder(folderName, process.env.CHATS_ROOT_DIRECTORY);
};

const deleteAllFilesAndFolders = async () => {
  const service = google.drive({ version: "v3", auth });

  try {
    // List all files and folders in Google Drive
    const response = await service.files.list({
      q: `trashed = false`, // Ignore already-trashed files
      fields: "files(id, name, mimeType)",
      pageSize: 1000, // Adjust if you have more than 1000 items to ensure all items are listed
    });

    // Log the items for confirmation
    console.log("Files to be deleted:", response.data.files);

    // Loop through all files and delete them one by one
    for (const file of response.data.files) {
      try {
        await service.files.delete({ fileId: file.id });
        console.log(
          `Deleted: ${file.name} (ID: ${file.id}, Type: ${file.mimeType})`
        );
      } catch (deleteError) {
        console.error(
          `Failed to delete ${file.name} (ID: ${file.id}):`,
          deleteError
        );
      }
    }

    console.log("All files and folders deleted.");
  } catch (error) {
    console.error("Error fetching files:", error);
  }
};
const uploadResume = async (req, res) => {
  const service = google.drive({ version: "v3", auth });
  const { id } = req.body;
  const user = await UserModel.findById(id);
  const file = req.file;
  console.log(file);
  const resume_name = `cvresume_${user?.fullName}`;
  try {
    // Create or fetch the user's folder
    const directory = await createUsersFolder(user?.fullName);

    // Search for an existing resume file with the same name in the folder
    const searchQuery = `name = '${resume_name}' and '${directory}' in parents and trashed = false`;
    const existingFiles = await service.files.list({
      q: searchQuery,
      fields: "files(id, name)",
    });

    // If the file exists, delete it
    if (existingFiles.data.files.length > 0) {
      for (const existingFile of existingFiles.data.files) {
        await service.files.delete({ fileId: existingFile.id });
        // console.log(`Deleted existing file: ${existingFile.name}`);
      }
    }

    // Upload the new resume file
    const requestBody = {
      name: resume_name,
      parents: [directory],
    };
    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const uploadedFile = await service.files.create({
      requestBody,
      media,
      fields: "id, name, mimeType",
    });

    // Handle your custom logic for updating USERS here
    const uploadedResume = uploadedFile.data;

    // Update the user's resume details in the database
    const updatedUser = await UserModel.findByIdAndUpdate(
      id, // User's ID
      {
        "files.resume": {
          id: uploadedResume.id,
          name: uploadedResume.name,
          mimeType: await getFileExtension(uploadedResume.mimeType),
        },
      },
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      throw new Error("User not found");
    }

    // console.log(`Updated user resume details: ${JSON.stringify(updatedUser)}`);

    res.status(200).send({
      success: true,
      message: "Resume uploaded and user updated successfully",
      file: {
        id: uploadedResume.id,
        name: uploadedResume.name,
        mimeType: await getFileExtension(uploadedResume.mimeType),
      },
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({
      success: false,
      message: "An error occurred while uploading the resume",
      error: err.message,
    });
  }
};
const downloadFile = async (req, res) => {
  const { id } = req.params;
  const service = google.drive({ version: "v3", auth });
  try {
    // Fetch file metadata to get name and MIME type
    const fileMetadata = await service.files.get({
      fileId: id,
      fields: "name, mimeType", // Fetch name and MIME type
    });

    const { name, mimeType } = fileMetadata.data;
    console.log(`${name}.${await getFileExtension(mimeType)}`);
    // Fetch the file content as a stream
    const fileStream = await service.files.get(
      {
        fileId: id,
        alt: "media", // Fetch the file content
      },
      { responseType: "stream" } // Specify stream response
    );

    // Set response headers
    res.setHeader("Content-Disposition", " attachment");
    res.setHeader("Content-Type", " attachment");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="file ${name}.${await getFileExtension(mimeType)}"`
    );
    res.setHeader("Content-Type", mimeType);

    // Pipe the file stream to the response
    fileStream.data
      .on("end", () => console.log(`File ${id} download completed.`))
      .on("error", (error) => {
        console.error(`Error streaming file ${id}:`, error.message);
        res.status(500).send("Error downloading file.");
      })
      .pipe(res);

    console.log(`File ${id} download initialized.`);
  } catch (err) {
    console.error(`Failed to download file ${id}:`, err.message);
    res.status(500).send("Failed to process the file.");
  }
};
const getFileExtension = (mimeType) => {
  const mimeTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/zip": "zip",
    "application/illustrator": "ai",
    "image/vnd.adobe.photoshop": "psd",
    // Add more MIME types here as needed
  };

  return mimeTypes[mimeType] || "bin"; // Default to .bin if MIME type not recognized
};
const uploadChatFiles = async (req, res) => {
  const { userId, collaboratorId } = req.body;
  const uploadedFiles = req.files; // This contains the uploaded files

  const user = await UserModel.findById(userId);
  const collaborator = await CollaboratorModel.findById(collaboratorId);
  try {
    const directory = await createChatsFolder(collaborator?.title);
    // console.log(`Directory:\n${directory}\nFiles:\n${req.files}`); // Check the uploaded files

    res.status(200).send(uploadedFiles);
  } catch (err) {
    res.status(500).send("Error uploading files");
  }
};

module.exports = {
  createFolder,
  deleteAllFilesAndFolders,
  createUsersFolder,
  createChatsFolder,
  uploadResume,
  uploadChatFiles,
  downloadFile,
};

// const folder_structure = {
//   users: {
//     names: {
//       files: [], //resume/CV/portfolio
//       profile_photo: "", //Profile Picture
//
//     },
//   },
//   groupFolders: {
//     group_names: {
//       files: [], //All kinds of files uploaded within group
//     },
//   },
// };
