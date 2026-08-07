import axios from "axios";
import fs from "fs";
import path from "path";
import "dotenv/config";

const LEETCODE_API_URL = "https://leetcode.com/api/problems/all/";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const ALFA_LEETCODE_URL = "https://alfa-leetcode-api.onrender.com";
const OUTPUT_FILE = path.join(process.cwd(), "problems.json");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchProblemList() {
  console.log("🌐 Fetching master problem list from LeetCode API...");
  try {
    const response = await axios.get(LEETCODE_API_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 10000
    });

    const pairs = response.data?.stat_status_pairs || [];
    return pairs
      .filter((p) => !p.paid_only)
      .map((p) => {
        const diffMap = { 1: "Easy", 2: "Medium", 3: "Hard" };
        return {
          id: String(p.stat.frontend_question_id || p.stat.question_id),
          questionId: String(p.stat.question_id),
          title: p.stat.question__title,
          slug: p.stat.question__title_slug,
          difficulty: diffMap[p.difficulty?.level] || "Easy"
        };
      });
  } catch (err) {
    console.warn("⚠️ LeetCode API warning, using alfa-leetcode-api fallback:", err.message);
    try {
      const res = await axios.get(`${ALFA_LEETCODE_URL}/problems?limit=100`);
      return res.data?.problemsetQuestionList || [];
    } catch {
      return [];
    }
  }
}

async function fetchProblemDetails(problem) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags { name }
        content
        exampleTestcaseList
        codeSnippets { lang langSlug code }
      }
    }
  `;

  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL_URL,
      { query, variables: { titleSlug: problem.slug } },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 8000
      }
    );

    const q = response.data?.data?.question;
    if (!q) return null;

    const starterCode = {};
    (q.codeSnippets || []).forEach((s) => {
      if (s.langSlug === "javascript" || s.langSlug === "js") starterCode.javascript = s.code;
      if (s.langSlug === "python3" || s.langSlug === "python") starterCode.python = s.code;
      if (s.langSlug === "cpp") starterCode.cpp = s.code;
    });

    const testcases = q.exampleTestcaseList || [];
    const sampleTestCases = [];
    for (let i = 0; i < testcases.length; i += 2) {
      sampleTestCases.push({
        input: testcases[i] || "",
        output: testcases[i + 1] || ""
      });
    }

    const cleanDescription = (q.content || "")
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      questionId: String(q.questionId || problem.questionId || problem.id),
      id: Number(q.questionFrontendId || problem.id),
      title: q.title || problem.title,
      slug: q.titleSlug || problem.slug,
      difficulty: q.difficulty || problem.difficulty,
      description: cleanDescription.slice(0, 500) || `Solve ${q.title}`,
      topicTags: (q.topicTags || []).map((t) => t.name),
      codeSnippets: q.codeSnippets || [],
      starterCode: Object.keys(starterCode).length ? starterCode : {
        javascript: `function solution() {\n  // Code\n}`
      },
      sampleTestCases: sampleTestCases.length ? sampleTestCases : [
        { input: "sample_input", output: "sample_output" }
      ]
    };
  } catch (error) {
    return {
      questionId: String(problem.questionId || problem.id),
      id: Number(problem.id),
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      description: `Problem description for ${problem.title}.`,
      topicTags: ["Algorithms"],
      codeSnippets: [{ lang: "JavaScript", langSlug: "javascript", code: "function solution() {}" }],
      starterCode: { javascript: "function solution() {}" },
      sampleTestCases: [{ input: "nums = [1, 2]", output: "[1, 2]" }]
    };
  }
}

async function runScraper(limit = 10) {
  const masterList = await fetchProblemList();
  const targetList = masterList.slice(0, limit);
  const scrapedProblems = [];

  for (let i = 0; i < targetList.length; i++) {
    const p = targetList[i];
    console.log(`[${i + 1}/${targetList.length}] Scraping: ${p.title}...`);
    const details = await fetchProblemDetails(p);
    if (details) {
      scrapedProblems.push(details);
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedProblems, null, 2));
    }
    await delay(500);
  }

  console.log(`✅ Saved ${scrapedProblems.length} problems to ${OUTPUT_FILE}`);
}

const limit = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
runScraper(limit);
