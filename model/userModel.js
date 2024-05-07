// Define user models
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please enter fullname"],
      unique: true,
    },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: [true, "Please enter password"],
    },
    position: {
      type: Number,
      required: [true, "Please select position"],
      // 1 = admin
      // 2 = client
      // 3 = applicant
    },
    applicationStatus: {
      type: Number,
      required: [true, "Please select status"],
      // { value: 1, label: "All users" },
      // { value: 2, label: "Pending" },
      // { value: 3, label: "For review" },
      // { value: 4, label: "Accepted" },
      // { value: 5, label: "Rejected" },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  const user = this;
  user.password = await bcrypt.hash(user.password, salt);
  console.log("user about to be created & saved", user);
  next();
});

userSchema.post("save", function (doc, next) {
  console.log("new user was created & saved", doc);
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  try {
    if (this._update.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        this._update.password,
        saltRounds
      );
      this._update.password = hashedPassword;
      next();
    }
  } catch (error) {
    next(error);
  }
});
userSchema.post("findOneAndUpdate", function (doc, next) {
  console.log("user was updated & saved", doc);
  next();
});

const UserModel = mongoose.model("users", userSchema);
module.exports = UserModel;
