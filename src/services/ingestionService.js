import fs from "fs";
import { createRequire } from "module";
import OpenAI from "openai";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getPineconeIndex } from "../config/pinecone.js";

const ai = new OpenAI({
  apiKey: process.env.AICREDITS_API_KEY,
  baseURL: process.env.AICREDITS_BASE_URL,
});

const EMBEDDING_MODEL = process.env.AICREDITS_EMBEDDING_MODEL;

export const extractText = async (filePath, mimeType) => {
  if (mimeType === "application/pdf") {
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text;
  } else {
    return fs.readFileSync(filePath, "utf-8");
  }
};

export const chunkText = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const chunks = await splitter.createDocuments([text]);
  return chunks;
};

const embedText = async (text) => {
  const result = await ai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return result.data[0].embedding;
};

export const embedAndStore = async (chunks) => {
  const index = getPineconeIndex();
  const batchSize = 10;
  let totalStored = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const upsertData = [];
    for (let j = 0; j < batch.length; j++) {
      const text = batch[j].pageContent;
      const vector = await embedText(text);
      upsertData.push({
        id: `chunk-${i + j}-${Date.now()}`,
        values: vector,
        metadata: { text, chunkIndex: i + j },
      });
    }

    try {
      await index.upsert(upsertData);
    } catch (pineconeError) {
      throw pineconeError;
    }

    totalStored += batch.length;
  }

  return totalStored;
};

export const ingestDocument = async (filePath, mimeType) => {
  const text = await extractText(filePath, mimeType);
  const chunks = await chunkText(text);
  const totalStored = await embedAndStore(chunks);
  return { totalChunks: totalStored, textLength: text.length };
};
