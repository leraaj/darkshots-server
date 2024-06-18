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
} = require("../controllers/appointmentController");

router.get("/appointments", getAppointments);
router.get("/appointment/:id", getAppointment);
router.get("/view-appointments/:id", getAppointmentByUser);
router.delete("/appointments", deleteAllAppointments);
router.post("/appointment", addAppointment);
router.delete("/appointment/:id", deleteAppointment);
router.put("/appointment/:id", updateAppointment);

module.exports = router;
