const { request, response } = require("express");
const CollaboratorModel = require("../model/collaboratorModel");
const UserModel = require("../model/userModel");
const ChatModel = require("../model/chatModel");

// Function to fetch collaborators based on user position
const getCollaborators = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    console.error("Cannot fetch collaborators: User ID is undefined.");
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let collaborators;

    // If the user is an admin, fetch all collaborators
    if (user.position === 1) {
      collaborators = await CollaboratorModel.find({})
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("job users client title status createdAt updatedAt");
    } else if (user.position === 2) {
      collaborators = await CollaboratorModel.find({
        client: id, // Filter by the user's ID
      })
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("job users client title status createdAt updatedAt");
    } else {
      // Otherwise, fetch only the collaborators the user is involved in
      collaborators = await CollaboratorModel.find({
        users: id, // Filter by the user's ID
      })
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("job users client title status createdAt updatedAt");
    }

    // Fetch the latest chat for each collaborator
    const chatPromises = collaborators.map(async (collaborator) => {
      const latestChat = await ChatModel.findOne({
        collaborator: collaborator._id,
      })
        .sort({ "message.timestamp": -1 })
        .populate("sender", "_id fullName")
        .select("message.timestamp");
      const lastChat = await ChatModel.findOne({
        collaborator: collaborator._id,
      })
        .sort({ "message.timestamp": -1 })
        .populate("sender", "_id fullName")
        .select("message");
      return {
        collaborator,
        latestChat: latestChat ? latestChat.message[0] : null,
        lastChat: lastChat,
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
        lastChat: chat ? chat.lastChat : null,
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
    const { title, client, users, job, senderId } = req.body; // Expecting users to be an array

    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid input: users should be a non-empty array" });
    }

    const existingCollaborator = await CollaboratorModel.findOne({ title });
    if (existingCollaborator) {
      console.log(`Existing: ${existingCollaborator}`);
      return res.status(400).json({
        message: "Title already exists. Please choose a unique title.",
      });
    }

    // Create and save the new collaborator
    const collaborator = new CollaboratorModel({ title, client, job, users });
    await collaborator.validate();
    const addedCollaborator = await collaborator.save();

    // Store the new collaborator's ID
    const collabID = addedCollaborator._id;

    // Send a message announcing the new group's creation
    const messageContent = `🎉 Welcome to the "${title}" group chat! 🎉`;
    const newChat = new ChatModel({
      sender: senderId,
      collaborator: collabID,
      message: [{ type: "text", content: messageContent }],
    });

    // Save the chat
    const savedChat = await newChat.save();

    return res
      .status(201)
      .json({ collaborator: addedCollaborator, chat: savedChat });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// // Construct the message object using content from the request body
// const message = {
//   type: "text", // Use the type from request or default to "text"
//   content: `${title} has been created`, // Use the content from request
// };

// // Create a new chat instance
// const newChat = new ChatModel({
//   sender: senderId,
//   collaborator: collaboratorId,
//   message: [message], // Custom updatedAt date (if needed)
// });

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
