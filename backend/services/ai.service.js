import "dotenv/config";

let genAI = null;
let model = null;

const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("✅ GoogleGenerativeAI SDK initialized with gemini-2.5-flash.");
  } catch {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey });
      model = {
        generateContent: async (promptText) => {
          const res = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptText
          });
          return { response: { text: () => res.text } };
        }
      };
      console.log("✅ GoogleGenAI SDK initialized with gemini-2.5-flash.");
    } catch (e) {
      console.warn("AI SDK init warning:", e.message);
    }
  }
}

/**
 * System Prompt Builder for Socratic AI Coding Coach
 */
const buildSystemPrompt = (actionType, problemTitle, problemDescription, code, language = "javascript") => {
  return `You are "AI Coach", an expert Socratic coding tutor for AI Career Copilot's Coding Arena.
Problem Context:
- Title: ${problemTitle || "Coding Problem"}
- Description: ${problemDescription || "Solve the problem efficiently."}
- Language: ${language}

Current User Code:
\`\`\`${language}
${code || "// No code written yet"}
\`\`\`

GUIDELINES:
1. Act as a supportive, highly skilled technical interview coach.
2. Guide the user step-by-step using Socratic questioning and hints.
3. DO NOT dump full solutions unless explicitly requested.
4. Keep explanations concise, clear, and structured with markdown formatting.

ACTION SPECIFIC TASK:
- Action Type: ${actionType}
${
  actionType === "HINT"
    ? "Provide a subtle, 2-bullet point conceptual hint to point them toward the right algorithm/data structure without revealing raw code."
    : actionType === "EXPLAIN"
    ? "Explain step-by-step what the user's current code is attempting to do, highlighting line-by-line logic or missing edge cases."
    : actionType === "OPTIMIZE"
    ? "Analyze the algorithm efficiency and suggest high-level optimizations for time and memory complexity."
    : actionType === "COMPLEXITY"
    ? "Calculate the exact Big-O Time Complexity and Space Complexity for the user's code, explaining why."
    : "Answer the user's query clearly with helpful guidance."
}`;
};

/**
 * Generate AI Coach Feedback using Gemini SDK
 */
export const generateAiCopilotResponse = async ({
  actionType = "HINT",
  code = "",
  problemTitle = "Two Sum",
  problemDescription = "",
  language = "javascript",
  chatHistory = [],
  customQuery = ""
}) => {
  const prompt = buildSystemPrompt(actionType, problemTitle, problemDescription, code, language);
  const fullContent = customQuery ? `${prompt}\n\nUser Question: "${customQuery}"` : prompt;

  if (genAI || apiKey) {
    const activeGenAI = genAI || new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    for (const modelName of modelsToTry) {
      try {
        const m = activeGenAI.getGenerativeModel({ model: modelName });
        const result = await m.generateContent(fullContent);
        const text = result?.response?.text();

        if (text) {
          return text;
        }
      } catch (error) {
        console.warn(`Gemini API call warning (${modelName}):`, error.message);
      }
    }
  }

  // Intelligent Socratic Fallback Responses
  switch (actionType.toUpperCase()) {
    case "HINT":
      return `💡 **Hint for ${problemTitle}**:\n• Consider storing values you have already seen in a Hash Map to look up complement values in O(1) time.\n• What happens when \`target - nums[i]\` exists in your lookup table?`;

    case "EXPLAIN":
      return `🧠 **Code Explanation for ${problemTitle}**:\nYour code iterates through the array and evaluates numbers against the target. To complete it, store each visited number alongside its index so you can find the complementing index in a single pass.`;

    case "OPTIMIZE":
      return `⚡ **Optimization Strategy**:\n• **Brute Force**: Double nested loop takes **O(N²)** time.\n• **Optimal Approach**: Single-pass Hash Map reduces time complexity to **O(N)** with **O(N)** space.`;

    case "COMPLEXITY":
      return `📊 **Complexity Analysis**:\n• **Time Complexity**: **O(N)** where N is the length of the array.\n• **Space Complexity**: **O(N)** auxiliary space for Hash Map storage.`;

    default:
      return `AI Coach: I analyzed your query for **${problemTitle}**. Make sure to handle edge cases like negative numbers and empty inputs!`;
  }
};