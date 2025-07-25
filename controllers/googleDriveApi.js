const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const os = require("os");
const path = require("path");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");
const UserModel = require("../model/userModel");
const CollaboratorModel = require("../model/collaboratorModel");
const ChatModel = require("../model/chatModel");
const sharp = require("sharp");

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
  // const resume_name = `cvresume_${user?.fullName}`;
  console.log(JSON.stringify(req.file));
  const resume_name = file?.originalname?.replace(/\.[^/.]+$/, "");
  try {
    if (!user?.directories?.resume) {
      throw new Error("User does not have a resume directory assigned.");
    }

    const resumeDirectory = user.directories.resume;

    // Search for existing resume file in the resume directory
    const fileId = user?.resume?.id;

    if (fileId) {
      try {
        await service.files.delete({ fileId });
      } catch (err) {
        console.warn("File might not exist or already deleted:", err.message);
      }
    }

    // Upload the new resume file to the correct folder
    const requestBody = {
      name: resume_name,
      parents: [resumeDirectory], // ✅ Save directly in resume directory
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
    await service.permissions.create({
      fileId: uploadedFile.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    // Extract metadata
    const uploadedResume = uploadedFile.data;
    const fileTypeInfo = await getFileType(uploadedResume.mimeType);

    // Update user's resume metadata in the DB
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        resume: {
          id: uploadedResume.id,
          name: uploadedResume.name,
          mimeType: uploadedResume.mimeType,
          fileType: fileTypeInfo.category,
          filename: uploadedResume.name,
          extension: fileTypeInfo.mimeType,
        },
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found");

    res.status(200).send({
      success: true,
      message: "Resume uploaded and user updated successfully",
      file: updatedUser.resume,
    });
  } catch (err) {
    console.error("Error uploading resume:", err);
    res.status(500).send({
      success: false,
      message: "An error occurred while uploading the resume",
      error: err.message,
    });
  }
};
const uploadProfile = async (req, res) => {
  const service = google.drive({ version: "v3", auth });
  const { id } = req.body;
  const user = await UserModel.findById(id);
  const file = req.file;
  const profile_name = `profile_${user?.fullName}`;

  try {
    if (!user?.directories?.profile) {
      throw new Error("User does not have a profile directory assigned.");
    }

    const profileDirectory = user.directories.profile;

    const fileId = user?.profile?.id;

    if (fileId) {
      try {
        await service.files.delete({ fileId });
      } catch (err) {
        console.warn("File might not exist or already deleted:", err.message);
      }
    }

    // ✅ Crop and resize the image to 300x300 using sharp
    const tempCroppedPath = path.join(
      __dirname,
      `cropped_${file.filename || "profile"}.jpg`
    );
    await sharp(file.path).resize(300, 300).toFile(tempCroppedPath);

    const requestBody = {
      name: profile_name,
      parents: [profileDirectory],
    };

    const media = {
      mimeType: "image/jpeg",
      body: fs.createReadStream(tempCroppedPath),
    };

    const uploadedFile = await service.files.create({
      requestBody,
      media,
      fields: "id, name, mimeType",
    });

    // ✅ Set permission to make the file publicly accessible
    await service.permissions.create({
      fileId: uploadedFile.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // ✅ Clean up the cropped file
    fs.unlink(tempCroppedPath, (err) => {
      if (err) console.warn("Error deleting temp cropped image:", err);
    });

    // Extract metadata
    const uploadedProfile = uploadedFile.data;
    const fileTypeInfo = await getFileType(uploadedProfile.mimeType);

    // Update user's profile metadata in the DB
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        profile: {
          id: uploadedProfile.id,
          name: uploadedProfile.name,
          mimeType: uploadedProfile.mimeType,
          fileType: fileTypeInfo.category,
          filename: uploadedProfile.name,
          extension: fileTypeInfo.mimeType,
        },
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found");

    res.status(200).send({
      success: true,
      message: "Profile uploaded and user updated successfully",
      file: updatedUser.profile,
    });
  } catch (err) {
    console.error("Error uploading profile:", err);
    res.status(500).send({
      success: false,
      message: "An error occurred while uploading the profile",
      error: err.message,
    });
  }
};
const uploadPortfolio = async (req, res) => {
  const service = google.drive({ version: "v3", auth });
  const { id } = req.body;
  const files = req.files; // multiple files array

  if (!files || files.length === 0) {
    return res.status(400).send({
      success: false,
      message: "No portfolio files provided.",
    });
  }

  try {
    const user = await UserModel.findById(id);
    if (!user) throw new Error("User not found");

    if (!user.directories?.portfolio) {
      throw new Error("User does not have a portfolio directory assigned.");
    }

    const portfolioDirectory = user.directories.portfolio;

    // Step 1: Get existing portfolio file names to avoid duplicates
    const existingFiles = await service.files.list({
      q: `'${portfolioDirectory}' in parents and trashed = false`,
      fields: "files(id, name)",
    });

    const existingFileNames = existingFiles.data.files.map((file) => file.name);

    // Prepare an array to collect new portfolio file metadata
    const uploadedPortfolioFiles = [];

    for (const file of files) {
      // Ensure unique filename
      let uniqueName = file.originalname;
      let fileCount = 1;

      while (existingFileNames.includes(uniqueName)) {
        const nameParts = file.originalname.split(".");
        const extension = nameParts.pop();
        const baseName = nameParts.join(".");
        uniqueName = `${baseName} (${fileCount}).${extension}`;
        fileCount++;
      }
      existingFileNames.push(uniqueName);

      // Upload each file to Google Drive in the portfolio directory
      const requestBody = {
        name: uniqueName,
        parents: [portfolioDirectory],
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

      // Make file publicly readable
      await service.permissions.create({
        fileId: uploadedFile.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // Get category and extension info
      const fileTypeInfo = await getFileType(uploadedFile.data.mimeType);
      const fileExtension = getFileExtension(uploadedFile.data.mimeType);

      // Push metadata to array
      uploadedPortfolioFiles.push({
        id: uploadedFile.data.id,
        name: uploadedFile.data.name,
        mimeType: uploadedFile.data.mimeType,
        fileType: fileTypeInfo.category,
        filename: uploadedFile.data.name,
        extension: fileExtension,
      });

      // Cleanup local file after upload (optional but recommended)
      fs.unlink(file.path, (err) => {
        if (err) console.warn("Error deleting temp file:", err);
      });
    }

    // Step 3: Append new files metadata to user's portfolio array in DB
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $push: { portfolio: { $each: uploadedPortfolioFiles } } },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found after update");

    res.status(200).send({
      success: true,
      message: "Portfolio files uploaded successfully",
      files: uploadedPortfolioFiles,
    });
  } catch (error) {
    console.error("Error uploading portfolio files:", error);
    res.status(500).send({
      success: false,
      message: "Failed to upload portfolio files",
      error: error.message,
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
  uploadProfile,
  uploadPortfolio,
  uploadChatFiles,
  downloadFile,
};
