const { request, response } = require("express");
const CollaboratorModel = require("../model/collaboratorModel");
const UserModel = require("../model/userModel");
const ChatModel = require("../model/chatModel");

// Function to fetch collaborators based on user position
const getCollaborators = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findById(id).select("position");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const collaborators = await CollaboratorModel.find({})
      .populate("users", "_id fullName")
      .populate("job", "_id title details")
      .select("job users client title status createdAt updatedAt");

    // Fetch the latest chat for each collaborator
    const chatPromises = collaborators.map(async (collaborator) => {
      const latestChat = await ChatModel.findOne({
        collaborator: collaborator._id,
      })
        .sort({ "message.timestamp": -1 })
        .populate("sender", "_id fullName")
        .select("message.timestamp");

      return {
        collaborator,
        latestChat: latestChat ? latestChat.message[0] : null,
      };
    });

    const chats = await Promise.all(chatPromises);

    // Combine collaborators and their latest chat messages
    const combinedCollaborators = collaborators.map((collab) => {
      const chat = chats.find(
        (c) => c.collaborator._id.toString() === collab._id.toString()
      );
      return {
        ...collab.toObject(),
        latestChat: chat ? chat.latestChat : null,
      };
    });

    // Sort collaborators by latest chat timestamp (from most recent to oldest)
    combinedCollaborators.sort((a, b) => {
      const timestampA = a.latestChat?.timestamp || 0;
      const timestampB = b.latestChat?.timestamp || 0;
      return timestampB - timestampA;
    });

    res.status(200).json(combinedCollaborators);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Function to get a specific collaborator
const getCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const collaborator = await CollaboratorModel.find({ users: id })
      .populate("users", "_id fullName")
      .populate("job", "_id title details")
      .select("job users status createdAt updatedAt");

    if (!collaborator || collaborator.length === 0) {
      return res
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }

    res.status(200).json(collaborator);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Function to add a new collaborator
const addCollaborator = async (req, res) => {
  try {
    const { title, client, users, job } = req.body; // Expecting users to be an array
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid input: users should be a non-empty array" });
    }

    const existingCollaborator = await CollaboratorModel.findOne({ title });
    if (existingCollaborator) {
      return res
        .status(400)
        .json({
          message: "Title already exists. Please choose a unique title.",
        });
    }

    const collaborator = new CollaboratorModel({ title, client, job, users });

    // Validate and save the collaborator
    await collaborator.validate();
    const addedCollaborator = await collaborator.save();
    return res.status(201).json(addedCollaborator);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Function to update an existing collaborator
const updateCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { job, users } = req.body;

    const updatedCollaborator = await CollaboratorModel.findByIdAndUpdate(
      id,
      { job, users },
      { new: true }
    );

    if (!updatedCollaborator) {
      return res
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }

    res.status(200).json({ updatedCollaborator });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field value. This value already exists.",
        field: error.keyValue,
      });
    }
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Function to delete a collaborator
const deleteCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCollaborator = await CollaboratorModel.findByIdAndDelete(id);
    if (!deletedCollaborator) {
      return res
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }
    res.status(200).json(deletedCollaborator);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Function to delete all collaborators
const deleteAllCollaborators = async (req, res) => {
  try {
    await CollaboratorModel.deleteMany({});
    res
      .status(200)
      .json({ message: "All collaborators deleted successfully." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getCollaborators,
  getCollaborator,
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
  deleteAllCollaborators,
};
