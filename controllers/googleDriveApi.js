const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const os = require("os");
const path = require("path");
const API_KEY = "/etc/secrets/API_KEY";
const auth = new GoogleAuth({
  scopes: process.env.GOOGLE_SCOPES,
  keyFile: process.env.API_KEY,
  subject: process.env.COMPANY_EMAIL, // Replace with your personal Google account email
});

async function createFolder() {
  const service = google.drive({ version: "v3", auth });
  const fileMetadata = {
    name: "Invoices",
    mimeType: "application/vnd.google-apps.folder",
    parents: [process.env.FILE_ROOT_DIRECTORY],
  };

  try {
    // Step 1: Create the folder
    const file = await service.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });
    const folderId = file.data.id;
    console.log("Folder ID:", folderId);

    // Step 2: Share the folder with your personal account
    await service.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "writer", // or "reader", depending on your desired access level
        type: "user",
        emailAddress: process.env.COMPANY_EMAIL, // Replace with your personal email
      },
    });

    console.log("Folder shared with your personal account");

    return folderId;
  } catch (error) {
    console.error("Error creating or sharing folder:", error);
    throw error;
  }
}

async function uploadFile() {
  const before_sendFile = {
    name: "",
    parents: "",
    mimeType: "",
    directory: "",
  };
  const after_sendFile = {
    googleId: "",
    name: "",
    mimeType: "",
    folderId: "parents:[replace_with_actual_id]",
  };
  const service = google.drive({ version: "v3", auth });
  const requestBody = {
    name: "lera_test", //Replace with "user._id"_filename.filetype
    fields: "id",
    parents: ["1rV-UZAChd6QcULcs8l-zSpwXDFI29Nmx"], // "collaborator._id"
  };
  const media = {
    mimeType: "text/plain", //File mime type
    body: fs.createReadStream("test.txt"), //File directory
  };
  try {
    const file = await service.files.create({
      requestBody,
      media: media,
    });
    console.log("File Id:", file.data.id);

    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    console.log("Error:", err);
    throw err;
  }
}
async function downloadFile(realFileId) {
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
}

function getFileExtension(mimeType) {
  const mimeTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/zip": "zip",
    // Add more MIME types here as needed
  };

  return mimeTypes[mimeType] || "bin"; // Default to 'bin' if no match found
}

module.exports = { createFolder, uploadFile, downloadFile };
