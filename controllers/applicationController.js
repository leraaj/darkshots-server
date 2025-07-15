const ApplicationModel = require("../model/applicationModel");
const AppointmentModel = require("../model/appointmentModel");

const getApplications = async (request, response) => {
  try {
    const applications = await ApplicationModel.find({})
      .populate("user", "fullName email contact")
      .populate("job", "title details")
      .select(
        "job user applicationStatus phase complete createdAt updatedAt disabled "
      );

    if (!applications.length) {
      return response.status(404).json({ message: "No applications found" });
    }

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
      .select(
        "job user applicationStatus  phase complete  createdAt updatedAt  "
      );

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
const getApplicationByUser = async (request, response) => {
  try {
    const { id } = request.params;
    const applications = await ApplicationModel.find({ user: id })
      .populate("user", "_id fullName email contact")
      .populate("job", "title details")
      .select(
        "job user applicationStatus  phase complete  createdAt updatedAt  "
      );

    if (!applications || applications.length === 0) {
      return response
        .status(404)
        .json({ message: "No applications found for this user" });
    }

    response.status(200).json(applications);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const getNotification = async (request, response) => {
  try {
    const userId = request.params.id;

    // Get user-specific applications
    const applications = await ApplicationModel.find({ user: userId })
      .populate("user", "fullName email contact")
      .populate("job", "title details")
      .select(
        "_id job user applicationStatus phase complete createdAt updatedAt disabled"
      ); // <-- explicitly include _id

    // Get user-specific appointments
    const appointments = await AppointmentModel.find({ user: userId })
      .populate("user", "fullName _id")
      .populate("job", "title _id")
      .select(
        "_id job user phase appointmentStatus complete meetingLink meetingTime initialRemarks finalRemarks hiringRemarks createdAt updatedAt"
      ); // <-- explicitly include _id

    if (!applications.length && !appointments.length) {
      return response
        .status(404)
        .json({ message: "No notifications found for this user" });
    }

    response.status(200).json({ applications, appointments });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const addApplication = async (request, response) => {
  try {
    const { userId, jobId } = request.body;
    const application = new ApplicationModel({
      job: jobId,
      user: userId,
      phase: 1,
      applicationStatus: 1,
      complete: 0,
    });
    await application.validate();
    const addedApplication = await application.save();
    return response.status(201).json(addedApplication);
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const updateApplication = async (request, response) => {
  try {
    const { id } = request.params;
    const { applicationStatus, phase, complete } = request.body;
    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      id,
      { applicationStatus, phase, complete },
      { new: true }
    )
      .populate("user", "fullName _id")
      .populate("job", "title _id ")
      .select("job user applicationStatus phase complete disabled");

    response.status(200).json({ message: updatedApplication });
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

const deleteAllApplications = async (request, response) => {
  try {
    await ApplicationModel.deleteMany({});
    response
      .status(200)
      .json({ message: "All applications deleted successfully." });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};
const countUnfinishedPending = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await ApplicationModel.countDocuments({
      user: id,
      phase: 1,
      applicationStatus: 1,
      complete: 0,
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const countUnfinishedProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await ApplicationModel.countDocuments({
      user: id,
      phase: 1,
      applicationStatus: 2,
      complete: 0,
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  getApplications,
  getApplication,
  getNotification,
  addApplication,
  updateApplication,
  deleteApplication,
  deleteAllApplications,
  getApplicationByUser,
  countUnfinishedPending,
  countUnfinishedProgress,
};
