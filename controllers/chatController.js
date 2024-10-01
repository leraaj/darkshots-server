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

const addChat = async (request, response) => {
  try {
    const { messages } = request.body;
    const chat = new ChatModel({
      messages,
    });
    // Validate the user data
    await chat.validate();
    // If validation passes, save the user
    const sentChat = await chat.save();
    return response.status(201).json(sentChat);
  } catch (error) {
    // const validationErrors = {};
    // if (error.name === "ValidationError") {
    //   // Validation error occurred
    //   if (error.errors && Object.keys(error.errors).length > 0) {
    //     // Extract and send specific validation error messages
    //     for (const field in error.errors) {
    //       validationErrors[field] = error.errors[field].message;
    //     }
    //   }
    //   response.status(400).json({ errors: validationErrors });
    // } else {
    //   // Other types of errors (e.g., server error)
    //   console.error(error.message);
    //   response.status(500).json({ message: "Internal Server Error" });
    // }
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const updateChat = async (request, response) => {
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
    // if (error.code === 11000 || error.code === 11001) {
    //   // Handle duplicate field error here
    //   return response.status(400).json({
    //     message: "Duplicate field value. This value already exists.",
    //     field: error.keyValue, // The duplicate field and value
    //   });
    // }
    // Other validation or save errors
    response.status(500).json({ message: error.message, status: error.status });
  }
};

const deleteChat = async (request, response) => {
  try {
    const { id } = req.params;
    const deletedChat = await ChatModel.findByIdAndDelete(id);

    if (!deletedChat) {
      return res
        .status(404)
        .json({ message: `Cannot find chat with ID: ${id}` });
    }
    response.status(200).json(deletedChat);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  getChats,
  getChat,
  addChat,
  updateChat,
  deleteChat,
  deleteAllChat,
};
