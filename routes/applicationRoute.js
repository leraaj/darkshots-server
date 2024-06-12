const express = require("express");
const router = express.Router();
const {
  getApplications,
  addApplication,
  deleteApplication,
  getApplication,
  updateApplication,
  getNotification,
  deleteAllApplications,
} = require("../controllers/applicationController");

router.get("/applications", getApplications);
router.delete("/applications", deleteAllApplications);
router.post("/application", addApplication);
router.post("/notifications/:id", getNotification);
router.delete("/application/:id", deleteApplication);
router.get("/application/:id", getApplication);
router.put("/application/:id", updateApplication);
// router.use(requireAuth);

module.exports = router;
