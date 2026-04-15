import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./src/routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/chat", chatRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT);
