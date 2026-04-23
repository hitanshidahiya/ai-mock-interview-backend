const Interview = require("../models/Interview.js");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔥 Aggregation for stats
    const stats = await Interview.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          averageScore: { $avg: "$overallScore" },
          bestScore: { $max: "$overallScore" },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (stats.length === 0) {
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

    const data = stats[0];
    const incomplete = data.totalInterviews - data.completed;

    // 🔥 Recent (DB handles sorting + limit)
    const recent = await Interview.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("role overallScore createdAt status");

    // 🔥 Role stats
    const roleStatsArr = await Interview.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const roleStats = {};
    roleStatsArr.forEach((r) => {
      roleStats[r._id] = r.count;
    });

    // 🔥 Score trend
    const scoreTrend = await Interview.find({ user: userId })
      .sort({ createdAt: 1 })
      .select("createdAt overallScore");

    const formattedTrend = scoreTrend.map((i) => ({
      date: i.createdAt,
      score: i.overallScore,
    }));

    res.json({
      totalInterviews: data.totalInterviews,
      averageScore: Math.round(data.averageScore),
      bestScore: data.bestScore,
      completed: data.completed,
      incomplete,
      recent,
      scoreTrend: formattedTrend,
      roleStats,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
};