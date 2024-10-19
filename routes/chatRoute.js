const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  getChatsByCollaboratorId,
  addChat,
  updateChat,
  deleteChat,
  deleteAllChat,
  sendFile,
} = require("../controllers/chatController");

router.post("/chat", addChat);
router.post("/chat", upload.fields([{ name: "files" }]), sendFile);
router.get("/chats/collaborator/:id", getChatsByCollaboratorId);
router.put("/chat/:id", updateChat);
router.delete("/chat/:id", deleteChat);
// Testing
router.delete("/chats", deleteAllChat);

module.exports = router;
