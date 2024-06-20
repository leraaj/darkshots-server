// UNFINISHED
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
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
    applicationStatus: {
      type: Number,
      default: 1,
    },
    phase: {
      type: Number,
      default: 1,
    },
    complete: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Appointment model
const ApplicantModel = mongoose.model("Applicant", applicationSchema);

module.exports = ApplicantModel;
