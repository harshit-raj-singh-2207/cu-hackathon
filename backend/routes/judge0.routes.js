const express = require("express");
const router = express.Router();
const judge0Controller = require("../controllers/judge0.controller");

// GET /api/judge0/problems
router.get("/problems", judge0Controller.getProblems);

// POST /api/judge0/run
router.post("/run", judge0Controller.runCode);

// POST /api/judge0/submit
router.post("/submit", judge0Controller.submitCode);

module.exports = router;
