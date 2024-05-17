const JobModel = require("../model/jobModel");

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
    const jobDetails = request.body;

    // Create a new job instance and validate
    const addedJob = await JobModel.create(jobDetails);

    response.status(200).json(addedJob);
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
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
