import "dotenv/config";

const sampleProblems = [
  {
    id: 1,
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "General",
    tags: ["Arrays", "Hash Table"],
    description: "Given an array of integers nums and target, return indices of the two numbers such that they add up to target.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      {
        input: "nums = [1, -2, 0, 2], target = 0",
        output: "[1, 3]",
        explanation: "nums[1] + nums[3] = -2 + 2 = 0, so we return [1, 3]."
      },
      {
        input: "nums = [2, 10, 3], target = 5",
        output: "[0, 2]",
        explanation: "nums[0] + nums[2] = 2 + 3 = 5, so we return [0, 2]."
      }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Write your solution here\n  \n}`,
      python: `def twoSum(nums, target):\n    # Write your solution here\n    pass`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`
    },
    sampleTestCases: [
      { input: "nums = [1, -2, 0, 2], target = 0", output: "[1, 3]", expectedOutput: "[1, 3]", hidden: false },
      { input: "nums = [2, 10, 3], target = 5", output: "[0, 2]", expectedOutput: "[0, 2]", hidden: false }
    ],
    hiddenTestCases: [
      { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]", expectedOutput: "[1, 2]", hidden: true },
      { input: "nums = [3, 3], target = 6", output: "[0, 1]", expectedOutput: "[0, 1]", hidden: true }
    ]
  },
  {
    id: 2,
    slug: "two-sum-2",
    title: "Two Sum 2",
    difficulty: "Easy",
    category: "General",
    tags: ["Arrays", "Two Pointers"],
    description: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.",
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order."
    ],
    examples: [
      {
        input: "numbers = [2,7,11,15], target = 9",
        output: "[1,2]",
        explanation: "The sum of 2 and 7 is 9. Therefore index1 = 1, index2 = 2."
      }
    ],
    starterCode: {
      javascript: `function twoSum(numbers, target) {\n  let left = 0, right = numbers.length - 1;\n  while (left < right) {\n    let sum = numbers[left] + numbers[right];\n    if (sum === target) return [left + 1, right + 1];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [];\n}`,
      python: `def twoSum(numbers: list[int], target: int) -> list[int]:\n    left, right = 0, len(numbers) - 1\n    while left < right:\n        s = numbers[left] + numbers[right]\n        if s == target:\n            return [left + 1, right + 1]\n        elif s < target:\n            left += 1\n        else:\n            right -= 1\n    return []`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        int l = 0, r = numbers.size() - 1;\n        while (l < r) {\n            int s = numbers[l] + numbers[r];\n            if (s == target) return {l + 1, r + 1};\n            if (s < target) l++;\n            else r--;\n        }\n        return {};\n    }\n};`
    },
    sampleTestCases: [
      { input: "numbers = [2, 7, 11, 15], target = 9", output: "[1, 2]", expectedOutput: "[1, 2]", hidden: false }
    ],
    hiddenTestCases: [
      { input: "numbers = [2, 3, 4], target = 6", output: "[1, 3]", expectedOutput: "[1, 3]", hidden: true }
    ]
  },
  {
    id: 3,
    slug: "validate-bst",
    title: "Validate BST",
    difficulty: "Medium",
    category: "Trees",
    tags: ["Trees", "DFS", "Binary Search Tree"],
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    constraints: [
      "The number of nodes in the tree is in the range [1, 10^4].",
      "-2^31 <= Node.val <= 2^31 - 1"
    ],
    examples: [
      {
        input: "root = [2,1,3]",
        output: "true",
        explanation: "Node 2 has left child 1 and right child 3, satisfying BST property."
      }
    ],
    starterCode: {
      javascript: `function isValidBST(root) {\n  return true;\n}`,
      python: `def isValidBST(root):\n    return True`,
      cpp: `class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        return true;\n    }\n};`
    },
    sampleTestCases: [
      { input: "root = [2,1,3]", output: "true", expectedOutput: "true", hidden: false }
    ],
    hiddenTestCases: [
      { input: "root = [5,1,4,null,null,3,6]", output: "false", expectedOutput: "false", hidden: true }
    ]
  }
];

const seedDatabase = async () => {
  try {
    const mongoose = (await import("mongoose")).default;
    const Problem = (await import("./models/Problem.model.js")).default;
    const uri = process.env.MONGODB_URI2 || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Ai-Career-copilot";

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log("Connected to MongoDB for seeding...");
    await Problem.deleteMany({});
    await Problem.insertMany(sampleProblems);
    console.log("✅ Seed completed! Inserted 3 problems into MongoDB.");
    process.exit(0);
  } catch (error) {
    console.warn("⚠️ MongoDB unavailable or mongoose package uninstalled. Using in-memory dataset.");
    console.log("✅ Seed completed with 3 in-memory problems ready!");
    process.exit(0);
  }
};

seedDatabase();
