import express from "express";
import { saveSubmission } from "../controllers/submission.controller.js";

const router = express.Router();

// POST /api/submissions
router.post("/", saveSubmission);

export default router;
