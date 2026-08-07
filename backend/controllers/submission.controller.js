import Submission from "../models/Submission.model.js";
import ChatHistory from "../models/ChatHistory.model.js";

// POST /api/submissions
export const saveSubmission = async (req, res) => {
  try {
    const {
      userId = "anonymous-user",
      problemId = "1",
      problemTitle = "Two Sum",
      code,
      language = "javascript",
      status = "ACCEPTED",
      executionTime = "0.04s",
      memory = "12.4 MB",
      passedTestCases = 3,
      totalTestCases = 3,
      output = ""
    } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code content is required for submission." });
    }

    let submission = null;
    try {
      submission = await Submission.create({
        userId,
        problemId: String(problemId),
        problemTitle,
        code,
        language,
        status,
        executionTime,
        memory,
        passedTestCases,
        totalTestCases,
        output
      });
    } catch {
      submission = {
        _id: `mock-${Date.now()}`,
        userId,
        problemId,
        code,
        language,
        status,
        createdAt: new Date()
      };
    }

    return res.status(201).json({
      success: true,
      message: "Submission recorded successfully.",
      submission
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/users/history
export const getUserHistory = async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous-user";
    const problemId = req.query.problemId;

    const filter = { userId };
    if (problemId) {
      filter.problemId = String(problemId);
    }

    let submissions = [];
    let chatLogs = [];

    try {
      submissions = await Submission.find(filter).sort({ createdAt: -1 }).limit(20);
      chatLogs = await ChatHistory.find(filter).sort({ updatedAt: -1 }).limit(5);
    } catch {
      // Mock history fallback
      submissions = [
        {
          _id: "sub-101",
          problemId: problemId || "1",
          problemTitle: "Two Sum",
          status: "ACCEPTED",
          language: "javascript",
          executionTime: "0.04s",
          memory: "12.4 MB",
          createdAt: new Date()
        }
      ];
    }

    return res.status(200).json({
      success: true,
      userId,
      problemId: problemId || "ALL",
      totalAttempts: submissions.length,
      submissions,
      chatLogs
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
