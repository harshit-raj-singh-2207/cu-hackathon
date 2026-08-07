import { executeUserCode } from "../services/execution.service.js";
import Problem from "../models/Problem.model.js";

// POST /api/execute
export const handleExecuteCode = async (req, res) => {
  try {
    const { problemId, code, language = "javascript", isSubmit = false } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Source code parameter is required." });
    }

    let testCases = [
      { input: "nums = [1, -2, 0, 2], target = 0", output: "[1, 3]" },
      { input: "nums = [2, 10, 3], target = 5", output: "[0, 2]" },
      { input: "nums = [2, 3, 3], target = 6", output: "[1, 2]" }
    ];

    try {
      if (problemId) {
        const problem = await Problem.findOne({
          $or: [{ id: Number(problemId) || -1 }, { _id: problemId }]
        });
        if (problem) {
          testCases = isSubmit
            ? [...(problem.sampleTestCases || []), ...(problem.hiddenTestCases || [])]
            : problem.sampleTestCases || testCases;
        }
      }
    } catch {
      // Use default test cases if problem DB lookup fails
    }

    const result = await executeUserCode({
      problemId,
      code,
      language,
      testCases,
      isSubmit
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "RUNTIME_ERROR",
      error: error.message,
      executionTime: "N/A",
      memory: "N/A"
    });
  }
};
