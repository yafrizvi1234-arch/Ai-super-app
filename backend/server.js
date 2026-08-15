require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// AI SUPER APP - AI ROUTER
// Current active provider: Gemini
// Future providers: Llama, DeepSeek, Kimi, ChatGPT, Claude
// =====================================================

// Gemini model
const MODEL_NAME =
  process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// -----------------------------------------------------
// Middleware
// -----------------------------------------------------

app.use(cors());
app.use(express.json());

// -----------------------------------------------------
// Gemini API Key
// -----------------------------------------------------

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    '❌ GEMINI_API_KEY environment variable is not set.'
  );

  process.exit(1);
}

// -----------------------------------------------------
// Gemini Client
// -----------------------------------------------------

const genAI = new GoogleGenAI({
  apiKey
});

// =====================================================
// PROVIDERS
// =====================================================

const PROVIDERS = {
  gemini: {
    name: 'Gemini',
    enabled: true
  },

  llama: {
    name: 'Llama',
    enabled: false
  },

  deepseek: {
    name: 'DeepSeek',
    enabled: false
  },

  kimi: {
    name: 'Kimi',
    enabled: false
  },

  chatgpt: {
    name: 'ChatGPT',
    enabled: false
  },

  claude: {
    name: 'Claude',
    enabled: false
  }
};

// =====================================================
// GEMINI PROVIDER
// =====================================================

async function getGeminiReply(userMessage) {

  const response =
    await genAI.models.generateContent({

      model: MODEL_NAME,

      contents: userMessage

    });

  return response.text;
}

// =====================================================
// AI ROUTER
// =====================================================

async function aiRouter(userMessage, requestedProvider = 'gemini') {

  // Check requested provider
  const provider =
    PROVIDERS[requestedProvider];

  // Unknown provider → Gemini fallback
  if (!provider) {

    console.log(
      `⚠️ Unknown provider "${requestedProvider}". Using Gemini.`
    );

    return {
      reply: await getGeminiReply(userMessage),
      provider: 'gemini'
    };
  }

  // Provider exists but isn't connected yet
  if (!provider.enabled) {

    console.log(
      `⚠️ ${provider.name} is not connected. Using Gemini fallback.`
    );

    return {
      reply: await getGeminiReply(userMessage),
      provider: 'gemini'
    };
  }

  // ---------------------------------------------------
  // Gemini
  // ---------------------------------------------------

  if (requestedProvider === 'gemini') {

    return {
      reply: await getGeminiReply(userMessage),
      provider: 'gemini'
    };
  }

  // ---------------------------------------------------
  // Future providers
  // ---------------------------------------------------

  // Llama → future
  // DeepSeek → future
  // Kimi → future
  // ChatGPT → future
  // Claude → future

  return {
    reply: await getGeminiReply(userMessage),
    provider: 'gemini'
  };
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req, res) => {

  res.json({

    status: 'ok',

    router: 'active',

    defaultProvider: 'gemini',

    timestamp:
      new Date().toISOString()

  });

});

// =====================================================
// CHAT API
// =====================================================

app.post('/api/chat', async (req, res) => {

  try {

    const {
      message,
      model
    } = req.body;

    // -------------------------------------------------
    // Validate message
    // -------------------------------------------------

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {

      return res.status(400).json({

        error:
          'Request body must contain a non-empty "message" string.'

      });

    }

    // -------------------------------------------------
    // Requested model
    // -------------------------------------------------

    const requestedProvider =
      typeof model === 'string' &&
      model.trim().length > 0
        ? model.trim().toLowerCase()
        : 'gemini';

    console.log(
      `🤖 Request → ${requestedProvider}`
    );

    // -------------------------------------------------
    // AI Router
    // -------------------------------------------------

    const result =
      await aiRouter(
        message.trim(),
        requestedProvider
      );

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    res.json({

      reply: result.reply,

      provider: result.provider

    });

  }

  catch (error) {

    console.error(
      '❌ Chat API error:',
      error.message || error
    );

    res.status(500).json({

      error:
        'AI response failed. Please try again later.'

    });

  }

});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {

  res.status(404).json({

    error: 'Endpoint not found'

  });

});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

  console.error(
    'Unhandled error:',
    err
  );

  res.status(500).json({

    error:
      'Internal server error'

  });

});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

  console.log(
    `✅ Server running on http://localhost:${PORT}`
  );

  console.log(
    '🧠 AI Router: ACTIVE'
  );

  console.log(
    '🤖 Current provider: Gemini'
  );

});
