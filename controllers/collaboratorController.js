const { request } = require("express");
const CollaboratorModel = require("../model/collaboratorModel");
const UserModel = require("../model/userModel");
const ChatModel = require("../model/chatModel");

const getCollaborators = async (request, response) => {
  const { id } = request.params;

  try {
    // Find the user and check their position
    const user = await UserModel.findById(id).select("position");
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    let collaborators, chatPromises, chat, latestChat;
    switch (user?.position) {
      case 1: // ADMIN
        // Fetch all collaborators with populated fields
        collaborators = await CollaboratorModel.find({})
          .populate("users", "_id fullName")
          .populate("job", "_id title details")
          .select("job users client title status createdAt updatedAt");

        // Fetch the latest chat for each collaborator
        chatPromises = collaborators.map(async (collaborator) => {
          latestChat = await ChatModel.findOne({
            collaborator: collaborator._id,
          })
            .sort({ "message.timestamp": -1 }) // Sort by latest message timestamp
            .populate("sender", "_id fullName") // Populate sender details
            .select("message.timestamp");

          return {
            collaborator,
            latestChat: latestChat ? latestChat.message[0] : null, // Get the most recent message
          };
        });
        chats = await Promise.all(chatPromises);
        // Combine collaborators and their latest chat messages
        collaborators = collaborators.map((collab) => {
          chat = chats.find(
            (c) => c.collaborator._id.toString() === collab._id.toString()
          );
          return {
            ...collab.toObject(),
            latestChat: chat ? chat.latestChat : null,
          };
        });
        // Sort collaborators by latest chat timestamp (from most recent to oldest)
        collaborators.sort((a, b) => {
          const timestampA = a.latestChat?.timestamp || 0;
          const timestampB = b.latestChat?.timestamp || 0;
          return timestampB - timestampA;
        });
        break;

      case 2: // CLIENT
        // Fetch all collaborators with populated fields
        collaborators = await CollaboratorModel.find({})
          .populate("users", "_id fullName")
          .populate("job", "_id title details")
          .select("job users client title status createdAt updatedAt");

        // Fetch the latest chat for each collaborator
        chatPromises = collaborators.map(async (collaborator) => {
          latestChat = await ChatModel.findOne({
            collaborator: collaborator._id,
          })
            .sort({ "message.timestamp": -1 }) // Sort by latest message timestamp
            .populate("sender", "_id fullName") // Populate sender details
            .select("message.timestamp");

          return {
            collaborator,
            latestChat: latestChat ? latestChat.message[0] : null, // Get the most recent message
          };
        });
        chats = await Promise.all(chatPromises);
        // Combine collaborators and their latest chat messages
        collaborators = collaborators.map((collab) => {
          chat = chats.find(
            (c) => c.collaborator._id.toString() === collab._id.toString()
          );
          return {
            ...collab.toObject(),
            latestChat: chat ? chat.latestChat : null,
          };
        });
        break;

      case 3: // EMPLOYEE
        // Fetch all collaborators with populated fields
        collaborators = await CollaboratorModel.find({})
          .populate("users", "_id fullName")
          .populate("job", "_id title details")
          .select("job users client title status createdAt updatedAt");

        // Fetch the latest chat for each collaborator
        chatPromises = collaborators.map(async (collaborator) => {
          latestChat = await ChatModel.findOne({
            collaborator: collaborator._id,
          })
            .sort({ "message.timestamp": -1 }) // Sort by latest message timestamp
            .populate("sender", "_id fullName") // Populate sender details
            .select("message.timestamp");

          return {
            collaborator,
            latestChat: latestChat ? latestChat.message[0] : null, // Get the most recent message
          };
        });
        chats = await Promise.all(chatPromises);
        // Combine collaborators and their latest chat messages
        collaborators = collaborators.map((collab) => {
          chat = chats.find(
            (c) => c.collaborator._id.toString() === collab._id.toString()
          );
          return {
            ...collab.toObject(),
            latestChat: chat ? chat.latestChat : null,
          };
        });
        break;

      default:
        return response.status(400).json({ error: "Invalid user position" });
    }

    response.status(200).json(collaborators);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    response.status(500).json({ error: "Internal server error" });
  }
};

module.exports = getCollaborators;

const getCollaborator = async (request, response) => {
  try {
    const { id } = request.params;
    const collaborator = await CollaboratorModel.find({ users: id })
      .populate("users", "_id fullName")
    const collaborator = await CollaboratorModel.find({ users: id })
      .populate("users", "_id fullName")
      .populate("job", "_id title details")
      .select("job users status createdAt updatedAt");
      .select("job users status createdAt updatedAt");
    if (!collaborator) {
      return response
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }

    response.status(200).json(collaborator);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const addCollaborator = async (request, response) => {
  try {
    const { title, client, users, job } = request.body; // Expecting users to be an array
    if (!Array.isArray(users) || users.length === 0) {
      return response.status(400).json({
        message: "Invalid input: users should be a non-empty array",
      });
    }

    // Check if title is unique
    const existingCollaborator = await CollaboratorModel.findOne({ title });
    if (existingCollaborator) {
      return response.status(400).json({
        message: "Title already exists. Please choose a unique title.",
      });
    }

    const { title, client, users, job } = request.body; // Expecting users to be an array
    if (!Array.isArray(users) || users.length === 0) {
      return response.status(400).json({
        message: "Invalid input: users should be a non-empty array",
      });
    }

    // Check if title is unique
    const existingCollaborator = await CollaboratorModel.findOne({ title });
    if (existingCollaborator) {
      return response.status(400).json({
        message: "Title already exists. Please choose a unique title.",
      });
    }

    const collaborator = new CollaboratorModel({
      title,
      client,
      job,
      users,
      title,
      client,
      job,
      users,
    });

    // Validate and save the collaborator

    // Validate and save the collaborator
    await collaborator.validate();
    const addedCollaborator = await collaborator.save();
    return response.status(201).json(addedCollaborator);
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCollaborator = async (request, response) => {
  try {
    const { id } = request.params;
    const { job, users } = request.body;
    const updatedCollaborator = await CollaboratorModel.findByIdAndUpdate(
    const { job, users } = request.body;
    const updatedCollaborator = await CollaboratorModel.findByIdAndUpdate(
      id,
      { job, users },
      { job, users },
      { new: true }
    );

    if (!updatedCollaborator) {
    if (!updatedCollaborator) {
      return response
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }
    response.status(200).json({ updatedCollaborator });
    response.status(200).json({ updatedCollaborator });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001) {
      return response.status(400).json({
        message: "Duplicate field value. This value already exists.",
        field: error.keyValue,
        field: error.keyValue,
      });
    }
    response.status(500).json({ message: error.message, status: error.status });
  }
};

const deleteCollaborator = async (request, response) => {
  try {
    const { id } = request.params;
    const deletedCollaborator = await CollaboratorModel.findByIdAndDelete(id);
    if (!deletedCollaborator) {
      return response
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }
    response.status(200).json(deletedCollaborator);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteAllCollaborators = async (request, response) => {
  try {
    await CollaboratorModel.deleteMany({});
    response
      .status(200)
      .json({ message: "All collaborators deleted successfully." });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getCollaborators,
  getCollaborator,
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
  deleteAllCollaborators,
  deleteAllCollaborators,
};
