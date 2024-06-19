const AppointmentModel = require("../model/appointmentModel");

const getAppointments = async (request, response) => {
  try {
    const appointments = await AppointmentModel.find({})
      .populate("user", "fullName _id")
      .populate("job", "title _id")
      .select(
        "job user appointmentStatus meetingLink meetingTime phase createdAt updatedAt"
      );
    response.status(200).json(appointments);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const getAppointment = async (request, response) => {
  try {
    const { id } = request.params;
    const appointment = await AppointmentModel.findById(id)
      .populate("user", "fullName email")
      .populate("job", "title details")
      .select(
        "job user appointmentStatus phase meetingLink meetingTime createdAt updatedAt"
      );
    // Select the job, user, and status fields
    if (!appointment) {
      return response
        .status(404)
        .json({ message: `Cannot find any appointment with ID: ${id}` });
    }

    response.status(200).json(appointment);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};
const getAppointmentByUser = async (request, response) => {
  try {
    const { id } = request.params;
    const appointments = await AppointmentModel.find({ user: id })
      .populate("user", "_id fullName email contact")
      .populate("job", "title details")
      .select(
        "job user appointmentStatus phase disabled createdAt updatedAt  "
      );

    if (!appointments || appointments.length === 0) {
      return response
        .status(404)
        .json({ message: "No applications found for this user" });
    }

    response.status(200).json(appointments);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};
const addAppointment = async (request, response) => {
  try {
    const { userId, jobId, meetingLink, meetingTime } = request.body;
    console.log("inputs", userId, jobId, meetingLink, meetingTime);
    const appointment = new AppointmentModel({
      user: userId,
      job: jobId,
      meetingLink: meetingLink,
      meetingTime: meetingTime,
      appointmentStatus: 1,
      phase: 0,
    });
    // Validate the user data
    await appointment.validate();
    // If validation passes, save the user
    const addedAppointment = await appointment.save();
    return response.status(201).json(addedAppointment);
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
  }
};
const updateAppointment = async (request, response) => {
  try {
    const { id } = request.params;
    const { appointmentStatus, phase, disabled, meetingLink, meetingTime } =
      request.body;
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      id,
      { id, appointmentStatus, phase, disabled, meetingLink, meetingTime },
      { new: true }
    );

    if (!updatedAppointment) {
      return response
        .status(404)
        .json({ message: `Cannot find any appointment with ID: ${id}` });
    }
    response.status(200).json({ updatedAppointment });
  } catch (error) {
    // Other validation or save errors
    response.status(500).json({ message: error.message, status: error.status });
  }
};

const deleteAppointment = async (request, response) => {
  try {
    const { id } = request.params;
    const deletedAppointment = await AppointmentModel.findByIdAndDelete(id)
      .populate("user", "fullName email")
      .populate("job", "title details")
      .select("job user status createdAt updatedAt");
    if (!deletedAppointment) {
      return response
        .status(404)
        .json({ message: `Cannot find any appointment with ID: ${id}` });
    }
    response.status(200).json(deletedAppointment);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteAllAppointments = async (request, response) => {
  try {
    // Delete all applications
    await AppointmentModel.deleteMany({});
    response
      .status(200)
      .json({ message: "All applications deleted successfully." });
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  getAppointmentByUser,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  deleteAllAppointments,
};
