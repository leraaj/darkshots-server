const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();
const {
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
  login,
  logout,
  currentUser,
  currentUserMobile,
} = require("../controllers/userController");

// Login/Logout routes
router.post("/user/login", login);
router.post("/user/logout/:id", logout);

// router.post("/user/logout", logout);

// Routes that require authentication
router.post("/user/current-user", currentUser);
router.post("/user/current-user-mobile", currentUserMobile);
router.get("/users", getUsers);
router.post("/user", addUser);
router.delete("/user/:id", deleteUser);
router.get("/user/:id", getUser);
router.put("/user/:id", updateUser);

module.exports = router;
