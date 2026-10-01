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

app.use("/api/chat", chatRouter);

app.listen(PORT);
