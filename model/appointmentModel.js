// UNFINISHED
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jobs",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    meetingLink: {
      type: String,
      // required: true,
    },
    meetingTime: {
      type: String,
      // required: true,
    },
    phase: {
      type: Number,
      default: 1,
    },
    appointmentStatus: {
      type: Number,
      default: 1,
    },
    complete: {
      type: Number,
      default: 0,
    },
    initialRemarks: {
      type: String,
    },
    finalRemarks: {
      type: String,
    },
    clientRemarks: {
      type: String,
    },
    // Add Supporting Doc Ex. CV / Resume
  },
  {
    timestamps: true,
  }
);

// Create and export the Appointment model
const AppointmentModel = mongoose.model("Appointment", appointmentSchema);

module.exports = AppointmentModel;
