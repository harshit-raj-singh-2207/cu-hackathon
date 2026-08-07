import express from "express";
import { handleCopilotRequest } from "../controllers/ai.controller.js";

const router = express.Router();

// POST /api/ai/copilot or /api/ai/coach
router.post("/copilot", handleCopilotRequest);
router.post("/coach", handleCopilotRequest);

export default router;
