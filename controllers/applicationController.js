const ApplicationModel = require("../model/applicationModel");
const AppointmentModel = require("../model/appointmentModel");
const getApplications = async (request, response) => {
  try {
    const applications = await ApplicationModel.find({})
      .populate("user", "fullName email")
      .populate("job", "title details")
      .select("job user applicationStatus createdAt updatedAt");
    response.status(200).json(applications);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const getApplication = async (request, response) => {
  try {
    const { id } = request.params;
    const application = await ApplicationModel.findById(id)
      .populate("user", "fullName email")
      .populate("job", "title details")
      .select("job user applicationStatus createdAt updatedAt");
    // Select the job, user, and status fields
    if (!application) {
      return response
        .status(404)
        .json({ message: `Cannot find any application with ID: ${id}` });
    }

    response.status(200).json(application);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const addApplication = async (request, response) => {
  try {
    const { userId, jobId, applicationStatus } = request.body;
    const application = new ApplicationModel({
      job: jobId,
      user: userId,
      applicationStatus: applicationStatus,
    });
    // Validate the user data
    await application.validate();
    // If validation passes, save the user
    const addedCategory = await application.save();
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

const updateApplication = async (request, response) => {
  try {
    const { id } = request.params;
    const { user, job, applicationStatus } = request.body;
    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      id,
      { user, job, applicationStatus },
      { new: true }
    )
      .populate("user", "fullName _id")
      .populate("job", "title _id ")
      .select("job user applicationStatus");
    console.log(updatedApplication);

    // if (!updatedApplication) {
    //   return response
    //     .status(404)
    //     .json({ message: `Cannot find any application with ID: ${id}` });
    // }

    // const { jobId, userId } = updatedApplication;

    // // Populate user and job fields
    // await updatedApplication.ApplicationModel.findById(id)
    //   .populate("user", "_id fullName")
    //   .populate("job", "_id title")
    //   .execPopulate();
    // // Check if the status is equal to 2
    // if (updatedApplication.status === 2) {
    //   // Create a new appointment with status 1
    //   const newAppointment = new AppointmentModel({
    //     job: jobId,
    //     user: userId,
    //     status: 1, // Set appointment status to 1
    //     phase: 1, // 1 equal to pending, 2
    //   });

    //   // Save the new appointment
    //   await newAppointment.save();
    // }
    // Return updated application
    response.status(200).json(updatedApplication);
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

const deleteApplication = async (request, response) => {
  try {
    const { id } = request.params;
    const deletedApplication = await ApplicationModel.findByIdAndDelete(id)
      .populate("user", "fullName email")
      .populate("job", "title details")
      .select("job user status createdAt updatedAt");
    if (!deletedApplication) {
      return response
        .status(404)
        .json({ message: `Cannot find any application with ID: ${id}` });
    }
    response.status(200).json(deletedApplication);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getApplications,
  getApplication,
  addApplication,
  updateApplication,
  deleteApplication,
};
