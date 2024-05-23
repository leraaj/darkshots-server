// UNFINISHED
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: true,
        },
        details: {
          type: [
            {
              type: { type: String, enum: ["message", "image", "url"] },
              content: String,
            },
          ],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Orders",
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Chat model
const ChatModel = mongoose.model("Chat", chatSchema);

module.exports = ChatModel;
