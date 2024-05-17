const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  details: {
    why: {
      type: String,
      required: [true, "Description (why) is required"],
    },
    what: {
      type: String,
      required: [true, "Description (what) is required"],
    },
  },
  benefits: {
    pay: {
      type: String,
      required: [true, "Pay is required"],
    },
    schedule: {
      type: String,
      required: [true, "Schedule is required"],
    },
  },
  responsibilities: {
    type: [String],
    validate: {
      validator: function (array) {
        return array.length > 0;
      },
      message: "At least one responsibility is required.",
    },
  },
  requirements: {
    type: [String],
    validate: {
      validator: function (array) {
        return array.length > 0;
      },
      message: "At least one requirement is required.",
    },
  },
});

// Define models based on the schemas
const JobModel = mongoose.model("jobs", jobSchema);
module.exports = JobModel;
