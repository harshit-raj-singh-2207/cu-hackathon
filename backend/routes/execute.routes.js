import express from "express";
import { handleExecuteCode } from "../controllers/execution.controller.js";

const router = express.Router();

// POST /api/execute or /api/compile
router.post("/", handleExecuteCode);

export default router;
