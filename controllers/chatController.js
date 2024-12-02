const ChatModel = require("../model/chatModel");
const UserModel = require("../model/userModel");
const CollaboratorModel = require("../model/collaboratorModel");

// Get chats by collaborator ID
const getChatsByCollaboratorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch chats for the collaborator, sorted by createdAt in descending order
    const chats = await ChatModel.find({ collaborator: id })
      .populate({
        path: "sender",
        select: "_id fullName position",
      })
      .sort({ createdAt: -1 }) // Sort chat documents by createdAt in descending order
      .populate("collaborator", "_id")
      .select("_id sender message collaborator createdAt updatedAt");

    // Check and sort messages by timestamp within each chat document in ascending order
    chats.forEach((chat) => {
      if (Array.isArray(chat.message)) {
        chat.message.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      }
    });

    res.status(200).json(chats);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addChat = async (req, res) => {
  try {
    const { senderId, collaboratorId, content } = req.body;
    // Check if the user and collaborator exist
    const user = await UserModel.findById(senderId);
    const collaborator = await CollaboratorModel.findById(collaboratorId);

    if (!user || !collaborator) {
      return res
        .status(404)
        .json({ message: "User or collaborator not found" });
    }

    // Construct the message object using content from the request body
    const message = {
      type: "text", // Use the type from request or default to "text"
      content: content, // Use the content from request
    };

    // Create a new chat instance
    const newChat = new ChatModel({
      sender: senderId,
      collaborator: collaboratorId,
      message: [message], // Custom updatedAt date (if needed)
    });
    // Save the chat
    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (error) {
    console.error("Error saving chat:", error); // Log the error for debugging
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendFile = async (req, res) => {
  const files = req.files.files;
  console.log(files);
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
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  getChatsByCollaboratorId,
  addChat,
  sendFile,
  updateChat,
  deleteChat,
  deleteAllChat,
};
