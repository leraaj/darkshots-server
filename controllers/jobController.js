const ApplicantModel = require("../model/applicationModel");
const AppointmentModel = require("../model/appointmentModel");
const JobModel = require("../model/jobModel");

const getJobsMobile = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "Missing userId in query params" });
    }

    const jobs = await JobModel.find({})
      .populate({
        path: "category",
        select: "title",
      })
      .lean(); // Use .lean() so we can mutate job objects directly

    // Fetch user applications
    const userApplications = await ApplicantModel.find({
      user: userId,
      applicationStatus: { $gte: -1 },
    }).select("job createdAt");

    // Fetch user appointments
    const userAppointments = await AppointmentModel.find({
      user: userId,
      appointmentStatus: { $gte: -1 },
    }).select("job createdAt");

    // Organize by job ID for quick lookup
    const jobDisableDates = new Map();

    // Check applications
    for (const app of userApplications) {
      const jobId = app.job.toString();
      const existing = jobDisableDates.get(jobId);
      if (!existing || app.createdAt > existing) {
        jobDisableDates.set(jobId, app.createdAt);
      }
    }

    // Check appointments
    for (const appt of userAppointments) {
      const jobId = appt.job.toString();
      const existing = jobDisableDates.get(jobId);
      if (!existing || appt.createdAt > existing) {
        jobDisableDates.set(jobId, appt.createdAt);
      }
    }

    const jobsWithDisableDates = jobs.map((job) => {
      const jobId = job._id.toString();
      const baseDate = jobDisableDates.get(jobId);

      if (baseDate) {
        const disabledUntil = new Date(baseDate);
        disabledUntil.setDate(disabledUntil.getDate() + 30);

        const now = new Date();

        if (disabledUntil > now) {
          return {
            ...job,
            disabledUntil,
          };
        }
      }

      // No disable condition met or 30-day window has passed
      return job;
    });

    res.status(200).json(jobsWithDisableDates);
  } catch (error) {
    console.error("getJobsMobile error:", error);
    res.status(500).json({ message: error.message });
  }
};
const getJobs = async (req, res) => {
  try {
    const jobs = await JobModel.find({})
      .populate({
        path: "category",
        select: "title",
      })
      .lean(); // Converts Mongoose documents to plain JS objects

    res.status(200).json(jobs);
  } catch (error) {
    console.error("getJobs error:", error);
    res.status(500).json({ message: error.message });
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
    console.error("Error adding job:", error); // Log the error for debugging purposes
    response
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
  getJobsMobile,
  getJobs,
  getJob,
  addJob,
  updateJob,
  deleteJob,
};
