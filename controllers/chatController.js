const ChatModel = require("../model/chatModel");

const getChats = async (request, response) => {
  try {
    const chats = await ChatModel.find({});
    response.status(200).json(chats);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const getChat = async (request, response) => {
  try {
    const { id } = request.params;
    const chat = await ChatModel.findById(id);
    // Select the job, user, and status fields
    if (!chat) {
      return response
        .status(404)
        .json({ message: `Cannot find any chat with ID: ${id}` });
    }

    response.status(200).json(chat);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
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
    const { id } = request.params;
    const { messages } = request.body;
    const updateChat = await ChatModel.findByIdAndUpdate(
      id,
      { id, messages },
      { new: true }
    );

    if (!updateChat) {
      return response
        .status(404)
        .json({ message: `Cannot find any chat with ID: ${id}` });
    }
    response.status(200).json({ updateChat });
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
    const { id } = request.params;
    const deletedChat = await ChatModel.findByIdAndDelete(id);
    if (!deletedChat) {
      return response
        .status(404)
        .json({ message: `Cannot find any chat with ID: ${id}` });
    }
    response.status(200).json(deletedChat);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getChats,
  getChat,
  addChat,
  updateChat,
  deleteChat,
};
