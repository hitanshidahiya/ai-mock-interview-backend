const express = require("express");
const router = express.Router();
const { getPrepQuestions, getAITip, getRoleSuggestions } = require("../controllers/prepController.js");
const { protect } = require("../middleware/auth.js");

router.get("/questions", protect, getPrepQuestions);
router.post("/ai-tip", protect, getAITip);
router.post("/role-suggestions", protect, getRoleSuggestions);

module.exports = router;
