const express = require("express");
const router = express.Router();
const {
  getJobs,
  getJob,
  addJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

router.get("/jobs", getJobs);
router.post("/job", addJob);
router.delete("/job/:id", deleteJob);
router.get("/job/:id", getJob);
router.put("/job/:id", updateJob);
// router.use(requireAuth);

module.exports = router;
