import { generateAiCopilotResponse } from "../services/ai.service.js";

// POST /api/ai/copilot or /api/ai/coach
export const handleCopilotRequest = async (req, res) => {
  try {
    const {
      actionType = "HINT",
      action,
      code = "",
      problemTitle = "Two Sum",
      problemDescription = "",
      language = "javascript",
      chatHistory = [],
      query = "",
      customQuery = ""
    } = req.body;

    const finalAction = actionType || action || "HINT";
    const finalQuery = query || customQuery || "";

    const reply = await generateAiCopilotResponse({
      actionType: finalAction.toUpperCase(),
      code,
      problemTitle,
      problemDescription,
      language,
      chatHistory,
      customQuery: finalQuery
    });

    return res.status(200).json({
      success: true,
      actionType: finalAction.toUpperCase(),
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      reply: "⚠️ Unable to reach AI Coach right now. Please try again."
    });
  }
};