const express = require("express");
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
const UserModel = require("../model/userModel");
// Login/Logout takes precedence to set a TOKEN either with value or null

router.post("/user/login", login);
router.post("/user/logout", logout);
router.post("/user/current-user", currentUser);
router.post("/user/current-user-mobile", currentUserMobile);
router.post("/user/current-user", currentUser);
router.get("/users", getUsers);
router.post("/user", addUser);
router.delete("/user/:id", deleteUser);
router.get("/user/:id", getUser);
router.put("/user/:id", updateUser);
// The following requires a TOKEN for security purposes
// router.use(requireAuth);

module.exports = router;
