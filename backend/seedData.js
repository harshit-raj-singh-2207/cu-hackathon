import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGODB_URI2 || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Ai-Career-copilot';

const ProblemSchema = new mongoose.Schema({
  title: String,
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'] },
  category: String,
  description: String,
  constraints: [String],
  examples: [{ input: String, output: String, explanation: String }],
  starterCode: {
    javascript: String,
    python: String,
    cpp: String
  },
  testCases: [{ input: String, expectedOutput: String }]
});

const Problem = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);

const REAL_PROBLEMS = [
  // ARRAYS
  {
    title: "Two Sum",
    difficulty: "EASY",
    category: "Arrays",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", expectedOutput: "[1,2]" }
    ]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "EASY",
    category: "Arrays",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction.",
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "In this case, no transactions are done and max profit = 0." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} prices\n * @return {number}\n */\nfunction maxProfit(prices) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "prices = [7,1,5,3,6,4]", expectedOutput: "5" },
      { input: "prices = [7,6,4,3,1]", expectedOutput: "0" }
    ]
  },
  {
    title: "Contains Duplicate",
    difficulty: "EASY",
    category: "Arrays",
    description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9"
    ],
    examples: [
      { input: "nums = [1,2,3,1]", output: "true", explanation: "The value 1 appears at index 0 and index 3." },
      { input: "nums = [1,2,3,4]", output: "false", explanation: "All elements are distinct." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nfunction containsDuplicate(nums) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "nums = [1,2,3,1]", expectedOutput: "true" },
      { input: "nums = [1,2,3,4]", expectedOutput: "false" }
    ]
  },
  {
    title: "Product of Array Except Self",
    difficulty: "MEDIUM",
    category: "Arrays",
    description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer."
    ],
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "[2*3*4, 1*3*4, 1*2*4, 1*2*3] = [24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]", explanation: "Product of all elements except element at index 2 is 9." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nfunction productExceptSelf(nums) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "nums = [1,2,3,4]", expectedOutput: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]" }
    ]
  },
  {
    title: "Maximum Subarray",
    difficulty: "MEDIUM",
    category: "Arrays",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1", explanation: "The subarray [1] has the largest sum 1." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
      { input: "nums = [1]", expectedOutput: "1" }
    ]
  },
  {
    title: "3Sum",
    difficulty: "MEDIUM",
    category: "Arrays",
    description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    constraints: [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5"
    ],
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "Distinct triplets summing to 0 are [-1,0,1] and [-1,-1,2]." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nfunction threeSum(nums) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "nums = [-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" }
    ]
  },

  // TWO POINTERS
  {
    title: "Container With Most Water",
    difficulty: "MEDIUM",
    category: "Two Pointers",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    constraints: [
      "n == height.length",
      "2 <= n <= 10^5",
      "0 <= height[i] <= 10^4"
    ],
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The vertical lines are [1,8,6,2,5,4,8,3,7]. Max area = 49." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} height\n * @return {number}\n */\nfunction maxArea(height) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", expectedOutput: "49" }
    ]
  },
  {
    title: "Valid Palindrome",
    difficulty: "EASY",
    category: "Two Pointers",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters."
    ],
    examples: [
      { input: "s = \"A man, a plan, a canal: Panama\"", output: "true", explanation: "\"amanaplanacanalpanama\" is a palindrome." },
      { input: "s = \"race a car\"", output: "false", explanation: "\"raceacar\" is not a palindrome." }
    ],
    starterCode: {
      javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your code here\n        pass`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "s = \"A man, a plan, a canal: Panama\"", expectedOutput: "true" },
      { input: "s = \"race a car\"", expectedOutput: "false" }
    ]
  },

  // SLIDING WINDOW
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "MEDIUM",
    category: "Sliding Window",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    examples: [
      { input: "s = \"abcabcbb\"", output: "3", explanation: "The answer is \"abc\", with the length of 3." },
      { input: "s = \"bbbbb\"", output: "1", explanation: "The answer is \"b\", with the length of 1." }
    ],
    starterCode: {
      javascript: `/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your code here\n        pass`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "s = \"abcabcbb\"", expectedOutput: "3" },
      { input: "s = \"bbbbb\"", expectedOutput: "1" }
    ]
  },

  // STACK / QUEUE
  {
    title: "Valid Parentheses",
    difficulty: "EASY",
    category: "Stack/Queue",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    examples: [
      { input: "s = \"()[]{}\"", output: "true", explanation: "All brackets open and close in correct order." },
      { input: "s = \"(]\"", output: "false", explanation: "Mismatch parenthesis." }
    ],
    starterCode: {
      javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your code here\n        pass`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "s = \"()[]{}\"", expectedOutput: "true" },
      { input: "s = \"(]\"", expectedOutput: "false" }
    ]
  },

  // DYNAMIC PROGRAMMING
  {
    title: "Climbing Stairs",
    difficulty: "EASY",
    category: "Dynamic Programming",
    description: "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    constraints: [
      "1 <= n <= 45"
    ],
    examples: [
      { input: "n = 2", output: "2", explanation: "There are two ways to climb: (1 + 1) and (2)." },
      { input: "n = 3", output: "3", explanation: "There are three ways: (1+1+1), (1+2), and (2+1)." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your code here\n        pass`,
      cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "n = 2", expectedOutput: "2" },
      { input: "n = 3", expectedOutput: "3" }
    ]
  },
  {
    title: "Coin Change",
    difficulty: "MEDIUM",
    category: "Dynamic Programming",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.",
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4"
    ],
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1 (3 coins)" },
      { input: "coins = [2], amount = 3", output: "-1", explanation: "Cannot make amount 3 with coin 2." }
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "coins = [1,2,5], amount = 11", expectedOutput: "3" },
      { input: "coins = [2], amount = 3", expectedOutput: "-1" }
    ]
  },

  // LINKED LISTS
  {
    title: "Reverse Linked List",
    difficulty: "EASY",
    category: "Linked Lists",
    description: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
    constraints: [
      "The number of nodes in the list is in the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "1->2->3->4->5 becomes 5->4->3->2->1" }
    ],
    starterCode: {
      javascript: `/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def reverseList(self, head):\n        # Write your code here\n        pass`,
      cpp: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "head = [1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" }
    ]
  },

  // STRINGS
  {
    title: "Valid Anagram",
    difficulty: "EASY",
    category: "Strings",
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.",
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters."
    ],
    examples: [
      { input: "s = \"anagram\", t = \"nagaram\"", output: "true", explanation: "Both strings contain same character counts." },
      { input: "s = \"rat\", t = \"car\"", output: "false", explanation: "Different character sets." }
    ],
    starterCode: {
      javascript: `/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nfunction isAnagram(s, t) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your code here\n        pass`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "s = \"anagram\", t = \"nagaram\"", expectedOutput: "true" },
      { input: "s = \"rat\", t = \"car\"", expectedOutput: "false" }
    ]
  },

  // GRAPHS
  {
    title: "Number of Islands",
    difficulty: "MEDIUM",
    category: "Graphs",
    description: "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'."
    ],
    examples: [
      { input: "grid = [[\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]]", output: "2", explanation: "2 distinct island components exist." }
    ],
    starterCode: {
      javascript: `/**\n * @param {character[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n  // Write your code here\n};`,
      python: `class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        # Write your code here\n        pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "grid = [[\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]]", expectedOutput: "2" }
    ]
  }
];

import fs from 'fs';
import path from 'path';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    await mongoose.connection.collection('problems').drop().catch(() => {});
    console.log('🗑️ Existing problems collection cleared.');

    let combinedProblems = [...REAL_PROBLEMS];
    const problemsFile = path.join(process.cwd(), 'problems.json');

    if (fs.existsSync(problemsFile)) {
      try {
        const scraped = JSON.parse(fs.readFileSync(problemsFile, 'utf-8'));
        if (Array.isArray(scraped) && scraped.length > 0) {
          const existingTitles = new Set(REAL_PROBLEMS.map(p => p.title.toLowerCase()));

          scraped.forEach(sp => {
            if (sp.title && !existingTitles.has(sp.title.toLowerCase())) {
              const diff = (sp.difficulty || 'Easy').toUpperCase();
              const category = (sp.topicTags && sp.topicTags[0]) ? sp.topicTags[0] : 'Arrays';

              const testCases = (sp.sampleTestCases || []).map(tc => ({
                input: tc.input || 'nums = [1,2,3]',
                expectedOutput: tc.output || '0'
              }));

              if (testCases.length === 0) {
                testCases.push({ input: 'nums = [1,2,3]', expectedOutput: '0' });
              }

              combinedProblems.push({
                title: sp.title,
                difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(diff) ? diff : 'EASY',
                category: category,
                description: sp.description || `Solve ${sp.title} adhering to time complexity constraints.`,
                constraints: [
                  '1 <= input.length <= 10^5',
                  '-10^9 <= input[i] <= 10^9'
                ],
                examples: [
                  {
                    input: testCases[0]?.input || 'Sample Input',
                    output: testCases[0]?.expectedOutput || 'Sample Output',
                    explanation: `Standard execution for ${sp.title}.`
                  }
                ],
                starterCode: {
                  javascript: sp.starterCode?.javascript || `/**\n * @param {any} input\n * @return {any}\n */\nfunction solution() {\n  // Write code here\n};`,
                  python: sp.starterCode?.python || `class Solution:\n    def solution(self):\n        pass`,
                  cpp: sp.starterCode?.cpp || `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {}\n};`
                },
                testCases: testCases
              });
            }
          });
        }
      } catch (err) {
        console.warn('⚠️ Notice reading problems.json:', err.message);
      }
    }

    const created = await Problem.insertMany(combinedProblems);
    console.log(`🚀 Successfully seeded ${created.length} REAL LeetCode problems into MongoDB Atlas!`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
    process.exit(1);
  }
};

seedData();
