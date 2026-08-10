require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Gemini মডেল (env দিয়ে সহজেই বদলানো যাবে)
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Key চেক ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY environment variable is not set.');
  process.exit(1);
}

// --- Gemini Client ---
const genAI = new GoogleGenAI({ apiKey });

// --- Gemini Chat Helper (সরল, বর্তমান SDK অনুযায়ী) ---
async function getGeminiReply(userMessage) {
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: userMessage // সরাসরি string pass করলেই চলে
  });
  return response.text; // Gemini-র উত্তর
}

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// --- Chat Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Request body must contain a non-empty "message" string.'
      });
    }

    const reply = await getGeminiReply(message.trim());

    res.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error.message || error);
    res.status(500).json({
      error: 'AI response failed. Please try again later.'
    });
  }
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
