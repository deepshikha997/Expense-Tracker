const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const expenseRoutes = require("./routes/expenseRoutes");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const DEMO_USER_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@tracker.com").toLowerCase();
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || "password123";
const DEMO_USER_NAME = process.env.DEMO_USER_NAME || "Demo User";

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

async function ensureDemoUser() {
  const existingUser = await User.findOne({ email: DEMO_USER_EMAIL });
  if (existingUser) {
    console.log(`Demo user ready: ${DEMO_USER_EMAIL}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
  await User.create({
    name: DEMO_USER_NAME,
    email: DEMO_USER_EMAIL,
    password: hashedPassword,
  });

  console.log(`Demo user created: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
}

async function startServer() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing. Add it to backend/.env before starting the server.");
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing. Add it to backend/.env before starting the server.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");

    await ensureDemoUser();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
