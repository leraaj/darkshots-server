const mongoose = require("mongoose");

const collaboratorSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jobs",
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

collaboratorSchema.pre("save", async function (next) {
  console.log("Collaborator about to be created & saved", this);
  next();
});

collaboratorSchema.post("save", function (doc, next) {
  console.log("New collaborator was created & saved", doc);
  next();
});

collaboratorSchema.pre("findOneAndUpdate", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});

collaboratorSchema.post("findOneAndUpdate", function (doc, next) {
  console.log("Collaborator was updated & saved", doc);
  next();
});

const CollaboratorModel = mongoose.model("Collaborator", collaboratorSchema);
module.exports = CollaboratorModel;
