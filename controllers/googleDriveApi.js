const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const os = require("os");
const path = require("path");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");
const UserModel = require("../model/userModel");
const CollaboratorModel = require("../model/collaboratorModel");
const ChatModel = require("../model/chatModel");

const createFolder = async (folderName, parentId) => {
  const service = google.drive({ version: "v3", auth });

  // Google drive api Problem

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
        role: "reader",
        type: "anyone",
        emailAddress: process.env.COMPANY_EMAIL,
      },
    });

    return folderId;
  } catch (error) {
    console.error("Error creating or sharing folder:", error);
    throw error;
  }
};
const createUsersFolder = async (folderName) => {
  return await createFolder(folderName, process.env.USERS_ROOT_DIRECTORY);
};
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

    // Handle file category and metadata
    const uploadedResume = uploadedFile.data;
    const fileCategory = await getFileType(uploadedResume.mimeType).category; // Use your function to get the category
    const fileExtension = await getFileType(uploadedResume.mimeType).mimeType; // Get the extension

    // Update the user's resume details in the database
    const updatedUser = await UserModel.findByIdAndUpdate(
      id, // User's ID
      {
        "files.resume": {
          id: uploadedResume.id,
          name: uploadedResume.name,
          mimeType: uploadedResume.mimeType,
          fileType: fileCategory, // Save the category of the file
          filename: uploadedResume.name, // Save the filename
          extension: fileExtension, // Store the file extension
        },
      },
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      throw new Error("User not found");
    }

    res.status(200).send({
      success: true,
      message: "Resume uploaded and user updated successfully",
      file: {
        id: uploadedResume.id,
        name: uploadedResume.name,
        mimeType: uploadedResume.mimeType,
        fileType: fileCategory, // Return the file type (category)
        filename: uploadedResume.name, // Return the filename
        extension: fileExtension, // Return the file extension
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
    const downloadFileType = await getFileExtension(mimeType);
    console.log(`${name}.${downloadFileType}`);
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
      `attachment; filename="file ${name}.${downloadFileType}"`
    );
    res.setHeader("Content-Type", downloadFileType);

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
const getFileType = (mimeType) => {
  if (!mimeType || typeof mimeType !== "string") {
    return { category: "unknown", mimeType };
  }

  const categories = {
    image: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/svg+xml",
      "image/tiff",
      "image/x-icon",
      "image/heic",
      "image/vnd.adobe.photoshop", // JPEG, PNG, GIF, BMP, etc.
    ],
    document: [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
      "application/vnd.oasis.opendocument.text", // ODT
      "application/postscript",
      "application/illustrator", // AI, EPS
      "application/vnd.adobe.indesign-idml",
      "application/x-indesign", // InDesign
      "application/x-fdf",
      "application/vnd.adobe.xdp+xml", // Adobe Forms
    ],
    music: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/aac",
      "audio/flac",
      "audio/ogg",
      "audio/mp4",
      "audio/x-ms-wma",
      "audio/x-midi",
      "audio/webm", // music/audio formats
    ],
    video: [
      "video/mp4",
      "video/x-matroska",
      "video/x-msvideo",
      "video/quicktime",
      "video/webm",
      "video/x-ms-wmv",
      "video/x-flv",
      "video/mpeg",
      "video/3gpp",
      "video/x-ms-asf", // video formats
      "application/x-premiere-project",
      "application/x-vegas-project", // Video editing
    ],
  };

  for (const [category, mimeTypes] of Object.entries(categories)) {
    if (mimeTypes.includes(mimeType)) {
      return { category, mimeType };
    }
  }

  return { category: "unknown", mimeType };
};
const uploadChatFiles = async (req, res) => {
  const service = google.drive({ version: "v3", auth });
  const { userId, collaboratorId } = req.body;
  const uploadedFiles = req.files; // Array of uploaded files

  try {
    const user = await UserModel.findById(userId);
    const collaborator = await CollaboratorModel.findById(collaboratorId);
    if (!user || !collaborator)
      throw new Error("User or collaborator not found");

    // Create or get the chat folder for storing files
    const directory = await createChatsFolder(collaborator?.title);
    console.log(`Folder ID returned: ${directory}`);

    console.log(`Directory: ${directory}\nFiles:`, uploadedFiles);

    // Step (1) - Handle Duplicate File Naming
    const existingFiles = await service.files.list({
      q: `'${directory}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
    });
    const existingFileNames = existingFiles.data.files.map((file) => file.name);

    const uploadedFileData = [];

    for (const file of uploadedFiles) {
      let uniqueName = file.originalname;
      let fileCount = 1;

      // Ensure unique file names within the directory
      while (existingFileNames.includes(uniqueName)) {
        const nameParts = file.originalname.split(".");
        const extension = nameParts.pop();
        const baseName = nameParts.join(".");
        uniqueName = `${baseName} (${fileCount}).${extension}`;
        fileCount++;
      }
      existingFileNames.push(uniqueName);

      // Step (2) - Upload File to Google Drive
      const requestBody = {
        name: uniqueName,
        parents: [directory],
      };
      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      };

      const uploadedFile = await service.files.create({
        requestBody,
        media,
        fields:
          "id, name, mimeType, webViewLink, webContentLink, thumbnailLink, size, createdTime",
      });

      // Step (3) - Set File Permissions to Public
      await service.permissions.create({
        fileId: uploadedFile.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // Step (4) - Handle file category and extension
      const fileCategory = await getFileType(uploadedFile.data.mimeType)
        .category; // Get the category of the file
      const fileExtension = await getFileType(uploadedFile.data.mimeType)
        .mimeType; // Get the file extension

      // Step (5) - Store the file metadata
      uploadedFileData.push({
        type: "file",
        content: uploadedFile.data.id,
        fileType: fileCategory, // Add file category (image, document, music, video)
        filename: uniqueName, // Save the filename
        extension: fileExtension, // Store the file extension
        timestamp: new Date(),
      });
    }

    // Update the chat model with the uploaded files
    await ChatModel.create({
      sender: userId,
      collaborator: collaboratorId,
      message: uploadedFileData,
      createdAt: new Date(),
    });

    res.status(200).send({
      success: true,
      message: "Files uploaded and chat updated successfully",
      files: uploadedFileData,
    });
  } catch (err) {
    console.error("Error uploading files:", err);
    res.status(500).send({
      success: false,
      message: "An error occurred while uploading files",
      error: err.message,
    });
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
