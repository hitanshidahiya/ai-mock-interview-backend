const User = require("../models/User.js");
const Interview = require("../models/Interview.js");

exports.getStreak = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id, status: "completed" })
      .select("createdAt")
      .sort({ createdAt: 1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build heatmap data - last 90 days
    const heatmap = {};
    interviews.forEach((i) => {
      const date = new Date(i.createdAt);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().split("T")[0];
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    // Calculate streak
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const key = checkDate.toISOString().split("T")[0];
      if (heatmap[key]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Daily challenge - changes every day based on date
    const challenges = [
      { title: "The STAR Method Master", description: "Answer 3 behavioral questions using the STAR method", target: 3 },
      { title: "Tech Deep Dive", description: "Complete a full technical interview for any role", target: 5 },
      { title: "Speed Round", description: "Answer 5 questions in under 10 minutes", target: 5 },
      { title: "HR Champion", description: "Practice 3 HR and culture-fit questions", target: 3 },
      { title: "DSA Warrior", description: "Tackle 3 data structures & algorithms questions", target: 3 },
      { title: "Full Stack Challenge", description: "Complete an interview for a full-stack role", target: 5 },
      { title: "Consistency Builder", description: "Complete any interview today to keep your streak alive", target: 1 },
    ];

    const dayIndex = Math.floor(Date.now() / 86400000) % challenges.length;
    const todayKey = today.toISOString().split("T")[0];
    const dailyChallengeCompleted = !!heatmap[todayKey];

    res.json({
      streak,
      heatmap,
      dailyChallenge: {
        ...challenges[dayIndex],
        completed: dailyChallengeCompleted,
      },
    });
  } catch (err) {
    console.error("Streak error:", err);
    res.status(500).json({ message: "Error fetching streak" });
  }
};
