// UNFINISHED
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jobs",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    meetingId: {
      type: String,
      required: true,
    },
    passcode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Appointment model
const AppointmentModel = mongoose.model("Appointment", appointmentSchema);

module.exports = AppointmentModel;
