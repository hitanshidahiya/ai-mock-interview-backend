const express = require("express");
const router = express.Router();
const {
  startInterview, submitInterview,
  getInterviewHistory, getInterviewById, getActivity
} = require("../controllers/interviewController.js");
const { protect } = require("../middleware/auth.js");

router.post("/start", protect, startInterview);
router.post("/submit", protect, submitInterview);
router.get("/history", protect, getInterviewHistory);
router.get("/activity", protect, getActivity);
router.get("/:id", protect, getInterviewById);

module.exports = router;
