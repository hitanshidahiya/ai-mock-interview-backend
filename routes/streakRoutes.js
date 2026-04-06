const express = require("express");
const router = express.Router();
const { getStreak } = require("../controllers/streakController.jsx");
const { protect } = require("../middleware/auth.js");

router.get("/", protect, getStreak);

module.exports = router;
