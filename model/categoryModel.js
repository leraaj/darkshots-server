const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter your category"],
    unique: true, // Adding unique constraint for ensuring title uniqueness properly
    validate: [
      {
        validator: async function (value) {
          // Check uniqueness excluding the current document
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
});

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

// Register the model with Mongoose under the name "Category"
const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;
