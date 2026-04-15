import express from "express";
import { queryDocument } from "../services/queryService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { question, chatHistory } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const result = await queryDocument(question, chatHistory || []);
    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get answer: " + error.message });
  }
});

export default router;
