const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
      // 1 = admin
      // 2 = client
      // 3 = applicant
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
      // { value: 2, label: "Pending" },
      // { value: 3, label: "Accepted" },
      // { value: 4, label: "Rejected" },
    },
    loggedIn: {
      type: Number,
      required: [true, "Please select status"],
      // { value: 0 },
      // { value: 1  }, User allowed to logged-in, at-least 1
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  console.log("user about to be created & saved", this);
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

const UserModel = mongoose.model("Users", userSchema);
module.exports = UserModel;
