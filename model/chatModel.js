const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    collaborator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collaborator",
      required: true,
      index: false,
    },
    message: [
      {
        details: {
          type: [
            {
              type: { type: String, enum: ["text", "image", "file", "url"] },
              type: { type: String, enum: ["text", "image", "file", "url"] },
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
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ collaborator: 1 }, { unique: false });

chatSchema.index({ collaborator: 1 }, { unique: false });

const ChatModel = mongoose.model("Chat", chatSchema);

module.exports = ChatModel;
