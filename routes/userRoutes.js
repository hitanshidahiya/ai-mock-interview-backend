const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUser
} = require("../controllers/userController.jsx");

const { protect } = require("../middleware/authMiddleware.js");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, getUserProfile);
router.put("/update", protect, updateUser);

module.exports = router;