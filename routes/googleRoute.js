const express = require("express");
const fs = require("fs");
const { google } = require("googleapis");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files
const {
  createChatsFolder,
  createUsersFolder,
  uploadResume,
  uploadProfile,
  downloadFile,
  uploadChatFiles,
  uploadPortfolio,
  deletePortfolioFiles,
} = require("../controllers/googleDriveApi");
const { auth } = require("../GoogleDrive_API_KEY/googleAuth");

router.get("/create-chat-folder", createChatsFolder);
router.get("/create-user-folder", createUsersFolder);

router.get("/download-file/:id", downloadFile);
// For uploading resume
// Specifically tailored for updating/adding a resume
router.post("/upload-resume", upload.single("resume"), uploadResume);
router.post("/upload-profile", upload.single("profile"), uploadProfile);
router.post("/upload-files", upload.array("files"), uploadChatFiles);
router.post("/upload-portfolio", upload.array("portfolio"), uploadPortfolio);
router.post("/delete-portfolio", deletePortfolioFiles);
module.exports = router;
