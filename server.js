import express from "express";
import cors from "cors";
// Switch between different implementations:
// import { runFAQAgent } from "./agent.js";              // Full context (loads everything)
// import { runFAQAgent } from "./agent-with-rag.js";     // RAG with vector search (requires vector store)
import { runFAQAgent } from "./agent-simple-rag.js";     // Simple RAG with keyword search (no extra deps)
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static(__dirname)); // Serve static files

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FAQ Agent API is running" });
});

// Main API endpoint for asking questions
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide a valid question in the request body",
        example: { question: "What is the company's mission?" },
      });
    }

    // Call the agent
    const answer = await runFAQAgent(question.trim());

    res.json({
      question: question.trim(),
      answer: answer,
    });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred while processing your question",
    });
  }
});

// GET endpoint for simple queries (optional, for convenience)
app.get("/api/ask", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide a question using the 'q' query parameter",
        example: "/api/ask?q=What is the company's mission?",
      });
    }

    // Call the agent
    const answer = await runFAQAgent(q.trim());

    res.json({
      question: q.trim(),
      answer: answer,
    });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || "An error occurred while processing your question",
    });
  }
});

// HTMX endpoint - returns HTML fragment
app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question?.trim();

    if (!question || question.length === 0) {
      return res.status(400).send(`
        <div class="error-message" role="alert">
          <strong>Error:</strong> Please enter a question.
        </div>
      `);
    }

    // Call the agent
    const answer = await runFAQAgent(question);

    // Return HTML fragment that HTMX will swap in
    res.send(`
      <div class="message-pair">
        <div class="user-question">
          <strong>You asked:</strong> ${escapeHtml(question)}
        </div>
        <div class="bot-answer">
          <strong>Answer:</strong> ${escapeHtml(answer)}
        </div>
      </div>
    `);
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).send(`
      <div class="error-message" role="alert">
        <strong>Error:</strong> ${escapeHtml(error.message || "An error occurred while processing your question")}
      </div>
    `);
  }
});

// Helper function to escape HTML (server-side)
function escapeHtml(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FAQ Agent API server running on http://localhost:${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser to use the HTMX interface`);
  console.log(`📝 POST /api/ask - Ask a question (JSON body)`);
  console.log(`📝 POST /ask - HTMX endpoint (form data)`);
  console.log(`📝 GET  /api/ask?q=question - Ask a question (query param)`);
  console.log(`❤️  GET  /health - Health check`);
});

