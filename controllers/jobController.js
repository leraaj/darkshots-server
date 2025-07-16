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

    // ✅ Get all jobs
    const jobs = await JobModel.find({})
      .populate({ path: "category", select: "title" })
      .lean();

    // ✅ Fetch applications and appointments with statuses -1 and 1
    const userApplications = await ApplicantModel.find({
      user: userId,
      applicationStatus: { $in: [-1, 1] },
    }).select("job createdAt applicationStatus");

    const userAppointments = await AppointmentModel.find({
      user: userId,
      appointmentStatus: { $in: [-1, 1] },
    }).select("job createdAt appointmentStatus");

    // ✅ Map jobs to all related status records
    const jobStatusMap = new Map();

    // 🌀 Group applications
    for (const app of userApplications) {
      const jobId = app.job?.toString();
      if (!jobId) continue;
      if (!jobStatusMap.has(jobId)) {
        jobStatusMap.set(jobId, []);
      }
      jobStatusMap.get(jobId).push({
        status: app.applicationStatus,
        date: app.createdAt,
      });
    }

    // 🌀 Group appointments
    for (const appt of userAppointments) {
      const jobId = appt.job?.toString();
      if (!jobId) continue;
      if (!jobStatusMap.has(jobId)) {
        jobStatusMap.set(jobId, []);
      }
      jobStatusMap.get(jobId).push({
        status: appt.appointmentStatus,
        date: appt.createdAt,
      });
    }

    // ✅ Apply disable condition: if both -1 and 1 exist for a job
    const jobsWithDisableDates = jobs.map((job) => {
      const jobId = job._id.toString();
      const records = jobStatusMap.get(jobId);

      if (records) {
        const hasPositive = records.some((r) => r.status === 1);
        const hasNegative = records.some((r) => r.status === -1);

        if (hasPositive && hasNegative) {
          // Get the most recent date among both types
          const latestDate = records
            .filter((r) => r.status === 1 || r.status === -1)
            .reduce((max, r) => (r.date > max ? r.date : max), new Date(0));

          const disabledUntil = new Date(latestDate);
          disabledUntil.setDate(disabledUntil.getDate() + 30);

          if (disabledUntil > new Date()) {
            return {
              ...job,
              disabledUntil,
            };
          }
        }
      }

      return job;
    });

    return res.status(200).json(jobsWithDisableDates);
  } catch (error) {
    console.error("getJobsMobile error:", error);
    return res.status(500).json({ message: error.message });
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
