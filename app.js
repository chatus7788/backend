require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const passport = require("passport");
const authRoutes = require("./routes/authRoutes");
const passport = require("passport");

connectDB();
const app = express();
app.use(express.json());

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

require("./config/passport")(passport);
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

module.exports = app;
