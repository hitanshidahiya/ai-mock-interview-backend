const Interview = require("../models/Interview.js");
const { generateQuestionsAI, evaluateAnswerAI, deepDiveAnalysis, buildPersonaPrompt } = require("../services/aiService.js");


exports.startInterview = async (req, res) => {
  try {
    const { role, level, difficulty = "medium" } = req.body;
    if (!role) return res.status(400).json({ message: "Role is required" });

    const aiQuestions = await generateQuestionsAI(role, level, difficulty);
    if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
      return res.status(500).json({ message: "Failed to generate questions" });
    }

    const persona = buildPersonaPrompt(role, level, difficulty);
    const formattedQuestions = aiQuestions.map((q) => ({
      question: q.question,
      correctAnswer: q.answer,
    }));

    const interview = await Interview.create({
      user: req.user.id,
      role,
      level: level || "beginner",
      difficulty,
      persona,
      questions: formattedQuestions,
    });

    res.status(201).json({
      interviewId: interview._id,
      persona: `You are interviewing for ${role} (${difficulty} difficulty)`,
      questions: interview.questions.map((q) => ({ question: q.question })),
    });
  } catch (err) {
    console.error("Start Interview Error:", err);
    res.status(500).json({ message: "Server error while starting interview" });
  }
};

// ─── SUBMIT INTERVIEW ─────────────────────────────────────────────
exports.submitInterview = async (req, res) => {
  try {
    const { interviewId, answers } = req.body;
    if (!interviewId || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.status === "completed") return res.status(400).json({ message: "Interview already submitted" });

    // Parallel evaluation with persona-aware scoring
    const evaluations = await Promise.all(
      interview.questions.map((q, i) =>
        evaluateAnswerAI(q.question, q.correctAnswer, answers[i] || "", interview.role, interview.difficulty)
      )
    );

    let totalScore = 0;
    const updatedQuestions = interview.questions.map((q, i) => {
      const evalData = evaluations[i];
      const score = Number(evalData?.score) || 0;
      totalScore += score;
      return { ...q._doc, userAnswer: answers[i] || "", score, feedback: evalData?.feedback || "No feedback" };
    });

    // Run deep-dive analysis async in background
    const deepDive = await deepDiveAnalysis(updatedQuestions, interview.role);

    interview.questions = updatedQuestions;
    interview.overallScore = totalScore;
    interview.status = "completed";
    interview.deepDiveFeedback = { ...deepDive, overallScore: totalScore };

    await interview.save();

    res.json({
      message: "Interview submitted successfully",
      overallScore: totalScore,
      questions: interview.questions,
      deepDiveFeedback: interview.deepDiveFeedback,
    });
  } catch (err) {
    console.error("Submit Interview Error:", err);
    res.status(500).json({ message: "Server error while submitting interview" });
  }
};

// ─── GET HISTORY ──────────────────────────────────────────────────
exports.getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id })
      .select("role level difficulty overallScore status createdAt")
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
};

// ─── GET SINGLE ───────────────────────────────────────────────────
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.user.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: "Error fetching interview" });
  }
};

// ─── ACTIVITY AGGREGATION (MongoDB Pipeline) ──────────────────────
exports.getActivity = async (req, res) => {
  try {
    const activity = await Interview.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId.createFromHexString(req.user.id), status: "completed" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$overallScore" },
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, avgScore: { $round: ["$avgScore", 1] }, _id: 0 } }
    ]);
    res.json(activity);
  } catch (err) {
    console.error("Activity aggregation error:", err);
    res.status(500).json({ message: "Error fetching activity" });
  }
};
