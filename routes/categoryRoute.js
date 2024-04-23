const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/categories", getCategories);
router.post("/category", addCategory);
router.delete("/category/:id", deleteCategory);
router.get("/category/:id", getCategory);
router.put("/category/:id", updateCategory);
// router.use(requireAuth);

module.exports = router;
