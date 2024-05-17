//define job models
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
    descriptions: {
      why: {
        type: String,
        required: [true, "Description (why) is required"],
      },
      what: {
        type: String,
        required: [true, "Description (what) is required"],
      },
      benefits: {
        pay: {
          type: String,
          required: [true, "Pay is required"],
        },
        schedule: {
          type: String,
          required: [true, "Pay is required"],
        },
      },
    },
    lists: {
      responsibilities: {
        type: [String],
        required: [true, "At least one responsibility is required"],
        validate: {
          validator: function (array) {
            return array.length > 0;
          },
          message: "At least one responsibility is required.",
        },
      },
      requirements: {
        type: [String],
        required: [true, "At least one requirement is required"],
        validate: {
          validator: function (array) {
            return array.length > 0;
          },
          message: "At least one requirement is required.",
        },
      },
    },
  },
});
jobSchema.pre("save", async function (next) {
  console.log("Job about to be created & saved", this);
  next();
});

jobSchema.post("save", function (doc, next) {
  console.log("New job was created & saved", doc);
  next();
});

jobSchema.pre("findOneAndUpdate", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});

jobSchema.post("findOneAndUpdate", function (doc, next) {
  console.log("Job was updated & saved", doc);
  next();
});
// Define models based on the schemas
const JobModel = mongoose.model("jobs", jobSchema);
module.exports = JobModel;
