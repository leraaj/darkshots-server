// UNFINISHED
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jobs",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    // Add Supporting Doc Ex. CV / Resume
  },
  {
    timestamps: true,
  }
);

// Create and export the Notification model
const NotificationModel = mongoose.model("Notification", notificationSchema);

module.exports = NotificationModel;
