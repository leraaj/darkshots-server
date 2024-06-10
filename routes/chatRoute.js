const express = require("express");
const router = express.Router();
const {
  getChats,
  getChat,
  addChat,
  updateChat,
  deleteChat,
} = require("../controllers/chatController");

router.get("/chats", getChats);
router.post("/chat", addChat);
router.delete("/chat/:id", deleteChat);
router.get("/chat/:id", getChat);
router.put("/chat/:id", updateChat);
// router.use(requireAuth);

module.exports = router;
