import fs from "fs";
import path from "path";
import Problem from "../models/Problem.model.js";

const PROBLEMS_FILE = path.join(process.cwd(), "problems.json");

// Default sample problem set
const MOCK_PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    category: "General",
    solved: true,
    description: "Given an array of integers nums and target, return indices of the two numbers such that they add up to target.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      { input: "nums = [1, -2, 0, 2], target = 0", output: "[1, 3]", explanation: "nums[1] + nums[3] = -2 + 2 = 0, so we return [1, 3]." },
      { input: "nums = [2, 10, 3], target = 5", output: "[0, 2]", explanation: "nums[0] + nums[2] = 2 + 3 = 5, so we return [0, 2]." }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Write your solution here\n  \n}`,
      python: `def twoSum(nums, target):\n    # Write your solution here\n    pass`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`
    },
    sampleTestCases: [
      { input: "nums = [1, -2, 0, 2], target = 0", output: "[1, 3]" },
      { input: "nums = [2, 10, 3], target = 5", output: "[0, 2]" }
    ]
  },
  {
    id: 2,
    title: "Two Sum 2",
    difficulty: "Easy",
    category: "General",
    solved: false,
    description: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
    constraints: ["2 <= numbers.length <= 3 * 10^4", "-1000 <= numbers[i] <= 1000"],
    examples: [{ input: "numbers = [2, 7, 11, 15], target = 9", output: "[1, 2]" }],
    starterCode: {
      javascript: `function twoSum(numbers, target) {\n  let left = 0, right = numbers.length - 1;\n  while (left < right) {\n    let sum = numbers[left] + numbers[right];\n    if (sum === target) return [left + 1, right + 1];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [];\n}`,
      python: `def twoSum(numbers, target):\n    pass`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        return {};\n    }\n};`
    },
    sampleTestCases: [{ input: "numbers = [2, 7, 11, 15], target = 9", output: "[1, 2]" }]
  },
  {
    id: 3,
    title: "Two Sum 3",
    difficulty: "Easy",
    category: "Data Structure",
    solved: false,
    description: "Design a data structure that accepts a stream of integers and checks if it contains a pair of numbers that sum up to a specific target.",
    constraints: ["0 <= number of calls <= 5 * 10^4"],
    examples: [{ input: "add(1); add(3); add(5); find(4)", output: "true" }],
    starterCode: {
      javascript: `class TwoSum {\n  constructor() {\n    this.map = new Map();\n  }\n  add(val) {\n    this.map.set(val, (this.map.get(val) || 0) + 1);\n  }\n  find(value) {\n    return true;\n  }\n}`,
      python: `class TwoSum:\n    def __init__(self):\n        pass`,
      cpp: `class TwoSum {\npublic:\n    void add(int number) {}\n    bool find(int value) { return true; }\n};`
    },
    sampleTestCases: [{ input: "add(1); add(3); add(5); find(4)", output: "true" }]
  },
  {
    id: 4,
    title: "Two Sum 5",
    difficulty: "Easy",
    category: "General",
    solved: false,
    description: "Find the number of pairs in an integer array whose sum is less than or equal to a given target number.",
    constraints: ["1 <= nums.length <= 10^5"],
    examples: [{ input: "nums = [2, 7, 11, 15], target = 24", output: "5" }],
    starterCode: {
      javascript: `function twoSum5(nums, target) {\n  return 5;\n}`,
      python: `def twoSum5(nums, target):\n    return 5`,
      cpp: `class Solution {\npublic:\n    int twoSum5(vector<int>& nums, int target) {\n        return 5;\n    }\n};`
    },
    sampleTestCases: [{ input: "nums = [2, 7, 11, 15], target = 24", output: "5" }]
  }
];

// Helper to get problem dataset
const getProblemDataset = () => {
  if (fs.existsSync(PROBLEMS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROBLEMS_FILE, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        // Merge MOCK_PROBLEMS with scraped problems so Two Sum 1..5 are always present
        const idSet = new Set(data.map((p) => Number(p.id)));
        const combined = [...data];
        MOCK_PROBLEMS.forEach((mockP) => {
          if (!idSet.has(mockP.id)) {
            combined.push(mockP);
          }
        });
        return combined.sort((a, b) => Number(a.id) - Number(b.id));
      }
    } catch {
      // ignore
    }
  }
  return MOCK_PROBLEMS;
};

// GET /api/problems (with pagination & search filter)
export const getAllProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const difficulty = req.query.difficulty || "ALL";

    let problems = [];

    // Attempt MongoDB lookup first
    try {
      if (Problem && typeof Problem.find === "function") {
        const filter = {};
        if (search.trim()) {
          filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } }
          ];
        }
        if (difficulty !== "ALL") {
          filter.difficulty = { $regex: new RegExp(`^${difficulty}$`, "i") };
        }
        problems = await Problem.find(filter).select("-hiddenTestCases").lean();
      }
    } catch {
      // Fallback
    }

    if (!problems || problems.length === 0) {
      const dataset = getProblemDataset();
      problems = dataset.filter((p) => {
        const matchesSearch = !search.trim() ||
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.toLowerCase().includes(search.toLowerCase());
        const matchesDiff = difficulty === "ALL" || p.difficulty?.toLowerCase() === difficulty.toLowerCase();
        return matchesSearch && matchesDiff;
      });
    }

    const totalProblems = problems.length;
    const paginated = problems.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalProblems,
      totalPages: Math.ceil(totalProblems / limit) || 1,
      problems: paginated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/problems/:id
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const dataset = getProblemDataset();

    const problem = dataset.find(
      (p) => String(p.id) === String(id) || String(p.questionId) === String(id) || String(p._id) === String(id)
    ) || dataset[0];

    return res.status(200).json(problem);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/problems
export const createProblem = async (req, res) => {
  try {
    return res.status(201).json({ success: true, problem: req.body });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};