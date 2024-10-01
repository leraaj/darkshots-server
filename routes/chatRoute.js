const express = require("express");
const {
  getChatsByCollaboratorId,
  addChat,
  updateChat,
  deleteChat,
  deleteAllChat,
} = require("../controllers/chatController");

const router = express.Router();

const router = express.Router();

router.get("/chats/collaborator/:id", getChatsByCollaboratorId); // Get Chats by id
// POST route to add a new chat
router.post("/chat", addChat);
router.put("/chat/:id", updateChat);
router.delete("/chat/:id", deleteChat);
router.delete("/chats", deleteAllChat);

module.exports = router;
