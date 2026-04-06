const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    correctAnswer: { type: String },
    userAnswer: { type: String, default: "" },
    score: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, default: 0 },
    fillerWordCount: { type: Number, default: 0 },
    fillerWords: [String],
    improvedAnswers: [{ question: String, improvedAnswer: String }],
    strengths: [String],
    areasToImprove: [String],
    summary: { type: String, default: "" },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    persona: { type: String, default: "" },
    questions: [questionSchema],
    overallScore: { type: Number, default: 0 },
    status: { type: String, enum: ["started", "completed"], default: "started" },
    deepDiveFeedback: { type: feedbackSchema, default: null },
  },
  { timestamps: true }
);

// Index for fast aggregation queries
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
