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
      required: true,
    },
    meetingTime: {
      type: String,
      required: true,
    },
    appointmentStatus: {
      type: Number,
      required: true,
    },
    phase: {
      type: Number,
      required: true,
    },
    remarks: {
      type: [
        {
          type: {
            type: String,
            enum: ["phase1", "phase2", "phase3", "phase-1"],
          },
          content: String,
        },
      ],
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
