const CollaboratorModel = require("../model/collaboratorModel");

const getCollaborators = async (request, response) => {
  try {
    const collaborators = await CollaboratorModel.find({})
      .populate("user", "_id fullName")
      .populate("job", "_id title details")
      .select("job user status createdAt updatedAt");
    response.status(200).json(collaborators);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const getCollaborator = async (request, response) => {
  try {
    const { id } = request.params;
    const collaborator = await CollaboratorModel.findById(id)
      .populate("user", "_id fullName")
      .populate("job", "_id title details")
      .select("job user status createdAt updatedAt");
    // Select the job, user, and status fields
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
    const { userId, jobId } = request.body;
    const collaborator = new CollaboratorModel({
      job: jobId,
      user: userId,
    });
    // Validate the user data
    await collaborator.validate();
    // If validation passes, save the user
    const addedCategory = await collaborator.save();
    return response.status(201).json(addedCategory);
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

const updateCollaborator = async (request, response) => {
  try {
    const { id } = request.params;
    const { jobId, userId } = request.body;
    const updatedAppointment = await CollaboratorModel.findByIdAndUpdate(
      id,
      { id, jobId, userId },
      { new: true }
    );

    if (!updatedAppointment) {
      return response
        .status(404)
        .json({ message: `Cannot find any collaborator with ID: ${id}` });
    }
    response.status(200).json({ updatedAppointment });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001) {
      // Handle duplicate field error here
      return response.status(400).json({
        message: "Duplicate field value. This value already exists.",
        field: error.keyValue, // The duplicate field and value
      });
    }
    // Other validation or save errors
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

module.exports = {
  getCollaborators,
  getCollaborator,
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
};
