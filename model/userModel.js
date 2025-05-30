const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const googleFileSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    mimeType: { type: String },
    fileType: { type: String }, // Category/type of file (e.g., 'image', 'document')
    filename: { type: String }, // Actual file name
    extension: { type: String }, // File extension (e.g., 'pdf', 'jpg')
  },
  { _id: false }
);
// Fixed directories structure
const directoriesSchema = new mongoose.Schema(
  {
    root: { type: String, required: true },
    profile: { type: String, required: true },
    resume: { type: String, required: true },
    portfolio: { type: String, required: true },
  },
  { _id: false }
);
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please enter fullname"],
      unique: true,
    },
    contact: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter password"],
    },
    position: {
      type: Number,
      required: [true, "Please select position"],
      // 1 = admin, 2 = client, 3 = applicant
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Jobs",
      },
    ],
    applicationStatus: {
      type: Number,
      required: [true, "Please select status"],
      // 2 = Pending, 3 = Accepted, 4 = Rejected
    },
    profile: {
      type: googleFileSchema,
    },
    resume: {
      type: googleFileSchema,
    },
    portfolio: [googleFileSchema],

    // ✅ New directories field
    directories: {
      type: directoriesSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const UserModel = mongoose.model("Users", userSchema);
module.exports = UserModel;
