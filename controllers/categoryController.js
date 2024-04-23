const CategoryModel = require("../model/categoryModel");

const getCategories = async (request, response) => {
  try {
    const categories = await CategoryModel.find({});
    response.status(200).json(categories);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const getCategory = async (request, response) => {
  try {
    const { id } = request.params;
    const category = await CategoryModel.findById(id);
    if (!category) {
      return response
        .status(404)
        .json({ message: `Cannot find any category with ID: ${id}` });
    }
    response.status(200).json(category);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const addCategory = async (request, response) => {
  try {
    const { title } = request.body;
    const category = new CategoryModel({ title });
    // Validate the user data
    await category.validate();
    // If validation passes, save the user
    const addedCategory = await category.save();
    response.status(201).json(addedCategory);
  } catch (error) {
    const validationErrors = {};
    if (error.name === "ValidationError") {
      // Validation error occurred
      if (error.errors && Object.keys(error.errors).length > 0) {
        // Extract and send specific validation error messages
        for (const field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
      }
      response.status(400).json({ errors: validationErrors });
    } else {
      // Other types of errors (e.g., server error)
      console.error(error.message);
      response.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const updateCategory = async (request, response) => {
  try {
    const { id } = request.params;
    const { title } = request.body;
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      { id, title },
      { new: true }
    );
    if (!updatedCategory) {
      return response
        .status(404)
        .json({ message: `Cannot find any category with ID: ${id}` });
    }
    response.status(200).json(updatedCategory);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCategory = async (request, response) => {
  try {
    const { id } = request.params;
    const deletedCategory = await CategoryModel.findByIdAndDelete(id);
    if (!deletedCategory) {
      return response
        .status(404)
        .json({ message: `Cannot find any category with ID: ${id}` });
    }
    response.status(200).json(deletedCategory);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
};
