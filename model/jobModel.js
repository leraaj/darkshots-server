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
  },
  details: {
    why: {
      title: String,
      description: String,
    },
    what: {
      title: String,
      description: String,
    },
    responsibilities: {
      title: String,
      lists: [String],
    },
    requirements: {
      title: String,
      lists: [String],
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
