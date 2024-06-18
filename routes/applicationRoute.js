const express = require("express");
const router = express.Router();
const {
  getApplications,
  getApplicationByUser,
  addApplication,
  deleteApplication,
  getApplication,
  updateApplication,
  getNotification,
  deleteAllApplications,
  countUnfinishedPending,
  countUnfinishedProgress,
} = require("../controllers/applicationController");

router.get("/applications", getApplications);
router.get("/application/:id", getApplication);
router.get("/view-applications/:id", getApplicationByUser);
router.post("/application", addApplication);
router.post("/notifications/:id", getNotification);
router.delete("/application/:id", deleteApplication);
router.put("/application/:id", updateApplication);
router.delete("/applications", deleteAllApplications);
router.get("/countUnfinishedPending/:id", countUnfinishedPending);
router.get("/countUnfinishedProgress/:id", countUnfinishedProgress);
// router.use(requireAuth);

module.exports = router;
