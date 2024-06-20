const ApplicationModel = require("../model/applicationModel");
const AppointmentModel = require("../model/appointmentModel");

const getApplications = async (request, response) => {
  try {
    const applications = await ApplicationModel.find({})
      .populate("user", "fullName email contact")
      .populate("job", "title details")
      .select("job user phase applicationStatus createdAt updatedAt disabled ");

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
      .select("job user applicationStatus disabled createdAt updatedAt  ");

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
      .select("job user applicationStatus disabled createdAt updatedAt  ");

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

const getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const appointments = await AppointmentModel.find({ user: id })
      .populate("user", "fullName position email")
      .populate("job", "title details")
      .select(
        "job user meetingLink meetingTime appointmentStatus phase createdAt"
      );

    const applications = await ApplicationModel.find({ user: id })
      .populate("user", "fullName position email")
      .populate("job", "title details")
      .select("job user applicationStatus createdAt updatedAt disabled");

    const notifications = [
      ...appointments.map((appointment) => ({ ...appointment._doc })),
      ...applications.map((application) => ({ ...application._doc })),
    ];

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this user." });
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const addApplication = async (request, response) => {
  try {
    const { userId, jobId } = request.body;
    console.log(userId, jobId);
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
      { user, job, applicationStatus, phase, complete },
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
      applicationStatus: 1,
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
      applicationStatus: 2,
      disabled: false,
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
