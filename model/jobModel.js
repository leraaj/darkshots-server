const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
      required: true,
    },
    details: {
      why: {
        type: String,
        required: true,
      },
      what: {
        type: String,
        required: true,
      },
      responsibilities: {
        type: [String],
        required: true,
      },
      requirements: {
        type: [String],
        required: true,
      },
      benefits: {
        pay: {
          type: String,
          required: true,
        },
        schedule: {
          type: String,
          required: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const JobModel = mongoose.model("Jobs", jobSchema);
module.exports = JobModel;
