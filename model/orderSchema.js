// UNFINISHED
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    freelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const OrderModel = mongoose.model("Orders", orderSchema);

module.exports = OrderModel;
