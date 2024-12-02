const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const os = require("os");
const path = require("path");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");

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
const uploadFile = async (request, response) => {
  const { name, collaborator_id, mimeType, file } = request.params;
  const service = google.drive({ version: "v3", auth });
  const requestBody = {
    name: `${name}`,
    // name: `TEST`, //TEST
    fields: "id",
    parents: [`1RUrxWoJmcCsu2axjyJgUarRCxOjSemZE`], //TEST
    // parents: [`${collaborator_id}`], // "collaborator._id"
  };
  const media = {
    mimeType: mimeType, //File mime type
    // mimeType: "text/plain", //TEST
    body: fs.createReadStream(file), //File directory
    // body: fs.createReadStream("test.txt"), //TEST
  };
  try {
    const file = await service.files.create({
      requestBody,
      media: media,
    });
    return console.log(`FILE: ${file.data.id}`);
  } catch (err) {
    console.log("Error:", err);
    throw err;
  }
};
const downloadFile = async (realFileId) => {
  const service = google.drive({ version: "v3", auth });

  try {
    // First, get the file metadata to determine its name and MIME type
    const fileMetadata = await service.files.get({
      fileId: realFileId,
      fields: "name, mimeType", // Request only name and MIME type
    });

    const downloadsFolder = path.join(os.homedir(), "Downloads");
    const fileName = fileMetadata.data.name;
    const mimeType = fileMetadata.data.mimeType;
    const fileType = getFileExtension(mimeType);
    const destPath = path.join(downloadsFolder, `${fileName}.${fileType}`);
    const downloadedFilePath = fs.createWriteStream(destPath);

    // Now, download the file content
    const response = await service.files.get(
      { fileId: realFileId, alt: "media" },
      { responseType: "stream" }
    );

    // Pipe the response data into the file stream
    response.data
      .on("end", () => {
        console.log("File downloaded successfully.");
      })
      .on("error", (err) => {
        console.error("Error downloading the file:", err);
      })
      .pipe(downloadedFilePath); // Save to the dynamically determined file name
  } catch (err) {
    console.error("Error:", err);
    throw err;
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

module.exports = {
  createFolder,
  uploadFile,
  downloadFile,
  deleteAllFilesAndFolders,
  createUsersFolder,
  createChatsFolder,
  getFileExtension,
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
