const express = require("express");
const router = express.Router();
const {
  getAppointments,
  addAppointment,
  deleteAppointment,
  getAppointment,
  updateAppointment,
} = require("../controllers/appointmentController");

router.get("/appointments", getAppointments);
router.post("/appointment", addAppointment);
router.delete("/appointment/:id", deleteAppointment);
router.get("/appointment/:id", getAppointment);
router.put("/appointment/:id", updateAppointment);
// router.use(requireAuth);

module.exports = router;
