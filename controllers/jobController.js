const JobModel = require("../model/jobModel");
require("dotenv").config();

const getJobs = async (request, response) => {
  try {
    const joblists = await JobModel.find({}).populate({
      path: "category",
      select: "title", // This assumes your Category schema has a 'title' field
    });
    response.status(200).json(joblists);
  } catch (error) {
    console.log(error.message);
    response.status(500).json({ message: error.message });
  }
};

const getJob = async (request, response) => {
  try {
    const { id } = request.params;
    const job = await JobModel.findById(id);
    response.status(200).json({ job });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
const addJob = async (request, response) => {
  try {
    const { jobDetails } = request.body;

    // Create a new job instance without saving it to catch validation errors
    const job = new JobModel(jobDetails);

    // Validate the job data
    await job.validate();

    // If validation passes, save the job
    const addedJob = await job.save();

    response.status(201).json(addedJob);
  } catch (error) {
    const validationErrors = {};
    if (error.name === "ValidationError") {
      // Validation error occurred
      if (error.errors && Object.keys(error.errors).length > 0) {
        // Extract and send specific validation error messages
        for (const field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
      }
      response.status(400).json({ errors: validationErrors });
    } else {
      // Other types of errors (e.g., server error)
      console.error(error.message);
      response.status(500).json({ message: "Internal Server Error" });
    }
  }
};
const updateJob = async (request, response) => {
  try {
    const { id } = request.params;
    const job = await JobModel.findByIdAndUpdate(id, request.body, {
      new: true, // To return the updated document
      runValidators: true, // To run validation defined in your schema
    });

    if (!job) {
      return response
        .status(404)
        .json({ message: `Cannot find any job with ID: ${id}` });
    }

    response.status(200).json({ job });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001) {
      // Handle duplicate field error here
      return response.status(400).json({
        message: "Duplicate field value. This value already exists.",
        field: error.keyValue, // The duplicate field and value
      });
    }
    // Other validation or save errors
    response.status(500).json({ message: error.message, status: error.status });
  }
};
const deleteJob = async (request, response) => {
  try {
    const { id } = request.params;
    const job = await JobModel.findByIdAndDelete(id);
    if (!job) {
      return response
        .status(404)
        .json({ message: `Cannot find any job with ID: ${id}` });
    }
    response.status(200).json(job);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  getJobs,
  getJob,
  addJob,
  updateJob,
  deleteJob,
};
