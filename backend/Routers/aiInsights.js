import express from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import { createAiInsightsController } from "../controllers/aiInsightsController.js";

const router = express.Router();

router.post("/insights", authenticateToken, createAiInsightsController);

export default router;
