const ChatModel = require("../model/chatModel");
const UserModel = require("../model/userModel");
const CollaboratorModel = require("../model/collaboratorModel");
const { uploadFileToDrive } = require("./googleDriveApi");

// Get chats by collaborator ID
const getChatsByCollaboratorId = async (req, res) => {
  try {
    const { id } = req.params;
    const chats = await ChatModel.find({ collaborator: id })
      .populate({
        path: "sender",
        select: "_id fullName",
      })
      .populate("collaborator", "_id")
      .select("_id sender message collaborator createdAt updatedAt");

    // Sort the messages by timestamp within each chat document
    chats.forEach((chat) => {
      chat.message.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    });

    res.status(200).json(chats);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const addChat = async (req, res) => {
  try {
    const { senderId, collaboratorId, type, content } = req.body;
    // Check if the user and collaborator exist
    const user = await UserModel.findById(senderId);
    const collaborator = await CollaboratorModel.findById(collaboratorId);

    if (!user || !collaborator) {
      return res
        .status(404)
        .json({ message: "User or collaborator not found" });
    }
    // Construct the message object
    const message = {
      details: [
        {
          type: type,
          content: content,
        },
      ],
      timestamp: new Date(), // Or you can use Date.now()
    };
    // Create a new chat instance
    const newChat = new ChatModel({
      sender: senderId,
      collaborator: collaboratorId,
      message: [message],
    });
    // Save the chat
    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Update a chat by ID
const updateChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const updatedChat = await ChatModel.findByIdAndUpdate(
      id,
      { message },
      { new: true }
    );

    if (!updatedChat) {
      return res
        .status(404)
        .json({ message: `Cannot find chat with ID: ${id}` });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Delete a chat by ID
const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedChat = await ChatModel.findByIdAndDelete(id);

    if (!deletedChat) {
      return res
        .status(404)
        .json({ message: `Cannot find chat with ID: ${id}` });
    }

    res.status(200).json(deletedChat);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteAllChat = async (request, response) => {
  try {
    await ChatModel.deleteMany({});
    response.status(200).json({ message: "All chats deleted successfully." });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  getChatsByCollaboratorId,
  addChat,
  updateChat,
  deleteChat,
  deleteAllChat,
};
