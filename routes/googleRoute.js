const express = require("express");
const fs = require("fs");
const { google } = require("googleapis");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files
const {
  createChatsFolder,
  createUsersFolder,
  uploadFile,
  downloadFile,
  getFileExtension,
} = require("../controllers/googleDriveApi");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");
const UserModel = require("../model/userModel");

router.get("/create-chat-folder", createChatsFolder);
router.get("/create-user-folder", createUsersFolder);
// router.post("/upload-file", upload.single("file"), uploadFile);

router.get("/download-file/:id", async (req, res) => {
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
});

router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  const service = google.drive({ version: "v3", auth });
  const { name, id } = req.body;
  const file = req.file;
  const resume_name = `cvresume_${name}`;
  console.log("Details: ", name, id, file);

  try {
    // Create or fetch the user's folder
    const directory = await createUsersFolder(name);

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
        console.log(`Deleted existing file: ${existingFile.name}`);
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

    console.log(`Updated user resume details: ${JSON.stringify(updatedUser)}`);

    res.status(200).send({
      success: true,
      message: "Resume uploaded and user updated successfully",
      file: uploadedResume,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({
      success: false,
      message: "An error occurred while uploading the resume",
      error: err.message,
    });
  }
});

module.exports = router;
