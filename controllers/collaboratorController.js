const CollaboratorModel = require("../model/collaboratorModel");
const UserModel = require("../model/userModel");

const getCollaborators = async (request, response) => {
  try {
    // Get the user ID from the request parameters
    const { id } = request.params;

    // Fetch the user's position
    const user = await UserModel.findById(id).select("position");
    console.log(`Fetched user: ${user}`);

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    let collaborators;

    // Check the user's position and fetch the appropriate collaborators
    if (user.position === 1) {
      // Fetch all collaborators for admin
      collaborators = await CollaboratorModel.find({})
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("job users client title status createdAt updatedAt");
    } else if (user.position === 2) {
      // Fetch collaborators for client
      collaborators = await CollaboratorModel.find({ client: id })
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("job users client title status createdAt updatedAt");
    } else if (user.position === 3) {
      // Fetch collaborators for applicant
      collaborators = await CollaboratorModel.find({ users: id })
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("job users client title status createdAt updatedAt");
    } else {
      // Handle other positions or return an error if needed
      return response.status(400).json({ message: "Invalid user position" });
    }

    console.log(
      `Fetched collaborators: ${JSON.stringify(
        collaborators,
        null,
        2
      )}, User position: ${user.position}`
    );

    response.status(200).json(collaborators);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = getCollaborators;

const getCollaborator = async (request, response) => {
  try {
    const { id } = request.params;
    const collaborator = await CollaboratorModel.find({ users: id })
      .populate("users", "_id fullName")
      .populate("job", "_id title details")
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

    const collaborator = new CollaboratorModel({
      title,
      client,
      job,
      users,
    });

    // Validate and save the collaborator
    await collaborator.validate();
    const addedCollaborator = await collaborator.save();

    console.log("Collaborator group created successfully");
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
      id,
      { job, users },
      { new: true }
    );

    if (!updatedCollaborator) {
      return response
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }
    response.status(200).json({ updatedCollaborator });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001) {
      return response.status(400).json({
        message: "Duplicate field value. This value already exists.",
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
    console.log("All collaborators deleted successfully");
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
};
