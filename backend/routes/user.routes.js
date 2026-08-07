import express from "express";
import { getUserHistory } from "../controllers/submission.controller.js";

const router = express.Router();

// GET /api/users/history
router.get("/history", getUserHistory);

export default router;
