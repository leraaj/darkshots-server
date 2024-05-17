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
        required: true,
      },
      what: {
        type: String,
        required: true,
      },
    },
    lists: {
      responsibilities: {
        type: [String],
        required: true,
        validate: {
          validator: function (array) {
            return array.length > 0;
          },
          message: "At least one responsibility is required.",
        },
      },
      requirements: {
        type: [String],
        required: true,
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
  console.log("job about to be created & saved", this);
  next();
});
jobSchema.post("save", function (doc, next) {
  console.log("new job was created & saved", doc);
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
  console.log("job was updated & saved", doc);
  next();
});
// Define models based on the schemas
const JobModel = mongoose.model("jobs", jobSchema);
module.exports = JobModel;
