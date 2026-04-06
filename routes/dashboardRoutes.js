const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/dashboardController.jsx");
const { protect } = require("../middleware/auth.js");

router.get("/", protect, getDashboard);

module.exports = router;
