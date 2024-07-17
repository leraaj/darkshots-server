const express = require("express");
const {
  getChats,
  getChat,
  getChatsByCollaboratorId,
  addChat,
  updateChat,
  deleteChat,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/chats", getChats);
router.get("/chat/:id", getChat);
router.get("/chats/collaborator/:id", getChatsByCollaboratorId); // New route
// POST route to add a new chat
router.post("/chat", addChat);
router.put("/chat/:id", updateChat);
router.delete("chat/:id", deleteChat);

module.exports = router;
