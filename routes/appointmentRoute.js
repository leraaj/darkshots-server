const express = require("express");
const router = express.Router();
const {
  getAppointments,
  getAppointment,
  getAppointmentByUser,
  addAppointment,
  deleteAppointment,
  updateAppointment,
  deleteAllAppointments,
  countAwaiting,
  countInitial,
  countFinal,
  getHiredApplicants,
  countBriefing,
} = require("../controllers/appointmentController");

router.get("/appointments", getAppointments);
router.get("/applicants", getHiredApplicants);
router.get("/appointment/:id", getAppointment);
router.get("/view-appointments/:id", getAppointmentByUser);
router.delete("/appointments", deleteAllAppointments);
router.post("/appointment", addAppointment);
router.delete("/appointment/:id", deleteAppointment);
router.put("/appointment/:id", updateAppointment);
// Counting Pending Appointments
router.get("/countWaiting/:id", countAwaiting);
router.get("/countInitial/:id", countInitial);
router.get("/countFinal/:id", countFinal);
router.get("/countBriefing/:id", countBriefing);

module.exports = router;
