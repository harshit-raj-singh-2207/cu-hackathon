require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Problem = require("../models/Problem");

async function seedProblems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const filePath = path.join(__dirname, "problems.json");

    const problems = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    await Problem.deleteMany();

    await Problem.insertMany(problems);

    console.log("✅ Problems Seeded Successfully");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedProblems();