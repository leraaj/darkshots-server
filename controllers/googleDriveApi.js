const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const path = require("path");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");

const createFolder = async (folderName) => {
  const service = google.drive({ version: "v3", auth });
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [process.env.FILE_ROOT_DIRECTORY],
  };
  try {
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
const uploadFile = async (request, response) => {
  const { name, collaborator_id, mimeType, file } = request.params;

  const service = google.drive({ version: "v3", auth });
  const requestBody = {
    name: `${name}`,
    fields: "id",
    parents: [`${collaborator_id}`], // "collaborator._id"
  };
  const media = {
    mimeType: mimeType, //File mime type
    body: fs.createReadStream(file), //File directory
  };
  try {
    const file = await service.files.create({
      requestBody,
      media: media,
    });
    return file.data.id;
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
const getFileExtension = async (mimeType) => {
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

  return mimeTypes[mimeType]; // Default to 'bin' if no match found
};

module.exports = { createFolder, uploadFile, downloadFile };

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
