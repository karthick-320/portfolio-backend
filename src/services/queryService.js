import "dotenv/config";
import OpenAI from "openai";
import { getPineconeIndex } from "../config/pinecone.js";

const ai = new OpenAI({
  apiKey: process.env.AICREDITS_API_KEY,
  baseURL: process.env.AICREDITS_BASE_URL || "https://api.aicredits.in/v1",
});

const EMBEDDING_MODEL =
  process.env.AICREDITS_EMBEDDING_MODEL || "google/gemini-embedding-001";

const CHAT_MODEL =
  process.env.AICREDITS_CHAT_MODEL || "google/gemini-2.5-flash";

const TOP_K = Number(process.env.RAG_TOP_K || 15);

const PORTFOLIO_EMAIL = "karthicksriram10@gmail.com";

const USAGE_LIMIT_MESSAGE =
  process.env.LLM_USAGE_LIMIT_MESSAGE ||
  `The usage limit for this portfolio assistant has been reached. For more details about Karthick, please contact him directly at ${PORTFOLIO_EMAIL}.`;

export const queryDocument = async (question, chatHistory = []) => {
  try {
    const embeddingResult = await ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
    });

    const questionVector = embeddingResult.data[0].embedding;

    const index = getPineconeIndex();

    const searchResults = await index.query({
      vector: questionVector,
      topK: TOP_K,
      includeMetadata: true,
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      return {
        answer: `I couldn't find relevant information. You can reach Karthick directly at ${PORTFOLIO_EMAIL}`,
        sources: [],
      };
    }

    const context = searchResults.matches
      .map((match, i) => `[Context ${i + 1}]:\n${match.metadata?.text || ""}`)
      .join("\n\n");
    const messages = [
      {
        role: "system",
        content: `You are Karthick's AI Portfolio Assistant.

Answer questions about Karthick professionally and confidently.

Rules:
- Answer ONLY from the context provided.
- Do not make up information.
- Be confident and concise — recruiters are busy.
- Speak in third person:
  "Karthick has..."
  "Karthick built..."
  "Karthick worked on..."
- If the answer is not available in the context, say:
"I don't have that detail. Reach Karthick at ${PORTFOLIO_EMAIL}"

Context about Karthick:
${context}`,
      },
      {
        role: "user",
        content: question,
      },
    ];

    const result = await ai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 500,
    });

    const answer =
      result.choices?.[0]?.message?.content ||
      `I don't have that detail. Reach Karthick at ${PORTFOLIO_EMAIL}`;

    return {
      answer,
      sources: searchResults.matches.map(
        (m) => `${m.metadata?.text?.substring(0, 100) || ""}...`,
      ),
    };
  } catch (error) {
    const errorMessage = error?.message?.toLowerCase() || "";

    const usageLimitExceeded =
      error?.code === "LLM_BUDGET_EXCEEDED" ||
      error?.code === "BUDGET_EXCEEDED" ||
      error?.code === "QUOTA_EXCEEDED" ||
      error?.code === "RESOURCE_EXHAUSTED" ||
      errorMessage.includes("quota") ||
      errorMessage.includes("credit") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("resource exhausted") ||
      errorMessage.includes("usage limit") ||
      errorMessage.includes("insufficient balance") ||
      errorMessage.includes("insufficient credits");

    if (usageLimitExceeded) {
      return {
        answer: USAGE_LIMIT_MESSAGE,
        sources: [],
      };
    }

    console.error("Portfolio AI error:", error);

    throw error;
  }
};
