// UNFINISHED
const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter your category"],
      unique: true,
      validate: [
        {
          validator: async function (value) {
            const category = await this.constructor.findOne({
              title: value,
              _id: { $ne: this._id },
            });
            return !category;
          },
          message: "This category has already been used",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("save", async function (next) {
  console.log("Category about to be created & saved", this);
  next();
});

categorySchema.post("save", function (doc, next) {
  console.log("New category was created & saved", doc);
  next();
});

categorySchema.pre("findOneAndUpdate", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});

categorySchema.post("findOneAndUpdate", function (doc, next) {
  console.log("Category was updated & saved", doc);
  next();
});

const CategoryModel = mongoose.model("Categories", categorySchema);
module.exports = CategoryModel;
