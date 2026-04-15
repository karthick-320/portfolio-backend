import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPineconeIndex } from "../config/pinecone.js";

export const queryDocument = async (question, chatHistory = []) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const embeddingModel = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
  });
  const embeddingResult = await embeddingModel.embedContent(question);
  const questionVector = Array.from(embeddingResult.embedding.values);

  const index = getPineconeIndex();
  const searchResults = await index.query({
    vector: questionVector,
    topK:15,
    includeMetadata: true,
  });

  if (!searchResults.matches || searchResults.matches.length === 0) {
    return {
      answer:
        "I couldn't find relevant information. You can reach Karthick directly at karthicksriram10@gmail.com",
      sources: [],
    };
  }

  const context = searchResults.matches
    .map((match, i) => `[Context ${i + 1}]:\n${match.metadata.text}`)
      .join("\n\n");

  const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are Karthick's AI Portfolio Assistant. Answer questions about Karthick professionally and confidently.

Rules:
- Answer ONLY from the context provided. Do not make up information.
- Be confident and concise — recruiters are busy.
- Speak in third person: "Karthick has...", "Karthick built..."
- If answer is not in context say: "I don't have that detail. Reach Karthick at karthicksriram10@gmail.com"

Context about Karthick:
${context}

Question: ${question}

Answer:`;

  const result = await chatModel.generateContent(prompt);
  const answer = result.response.text();

  return {
    answer,
    sources: searchResults.matches.map(
      (m) => m.metadata.text.substring(0, 100) + "...",
    ),
  };
};
