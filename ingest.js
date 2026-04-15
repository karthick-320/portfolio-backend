// backend/ingest.js  ← run this once from terminal
import dotenv from "dotenv";
dotenv.config();

import { ingestDocument } from "./src/services/ingestionService.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(
  __dirname,
  "data",
  "karthick_portfolio_knowledge_base.txt",
);


try {
  const result = await ingestDocument(filePath, "text/plain");
  process.exit(0);
} catch (err) {
  process.exit(1);
}
