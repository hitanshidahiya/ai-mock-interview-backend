const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors');
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const prepRoutes = require("./routes/prepRoutes");
const streakRoutes = require("./routes/streakRoutes");

dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://ai-mock-interview-frontend-topaz.vercel.app',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/prep", prepRoutes);
app.use("/api/streak", streakRoutes);

module.exports = app;
