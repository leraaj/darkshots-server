const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
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
});

// Define model based on the schema
const JobModel = mongoose.model("Job", jobSchema);

module.exports = JobModel;
