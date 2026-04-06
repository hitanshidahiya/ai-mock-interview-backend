const Interview = require("../models/Interview.js");

exports.getDashboard = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id });

    const total = interviews.length;

    if (total === 0) {
      return res.json({
        totalInterviews: 0,
        averageScore: 0,
        bestScore: 0,
        completed: 0,
        incomplete: 0,
        recent: [],
        scoreTrend: [],
        roleStats: {},
      });
    }

    let totalScore = 0;
    let bestScore = 0;
    let completed = 0;
    const roleStats = {};
    const scoreTrend = [];

    interviews.forEach((i) => {
      totalScore += i.overallScore;
      if (i.overallScore > bestScore) bestScore = i.overallScore;
      if (i.status === "completed") completed++;
      roleStats[i.role] = (roleStats[i.role] || 0) + 1;
      scoreTrend.push({ date: i.createdAt, score: i.overallScore });
    });

    const averageScore = Math.round(totalScore / total);
    const incomplete = total - completed;

    const recent = interviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    scoreTrend.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalInterviews: total,
      averageScore,
      bestScore,
      completed,
      incomplete,
      recent,
      scoreTrend,
      roleStats,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
};
