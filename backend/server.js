require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = Number(process.env.PORT) || 10000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(
  express.json({
    limit: '25mb'
  })
);

// =====================================================
// MODELS
// =====================================================

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.7-flash';

const GROQ_MODEL =
  process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || 'gpt-5.6-luna';

// =====================================================
// API KEYS
// =====================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GROQ_API_KEY =
  process.env.GROQ_API_KEY;

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;

// =====================================================
// GEMINI CLIENT
// =====================================================

let gemini = null;

if (GEMINI_API_KEY) {
  gemini = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });
}

// =====================================================
// STARTUP
// =====================================================

console.log('================================');
console.log('🚀 INFINITY AI');
console.log('================================');

console.log(
  `🧠 Gemini: ${
    GEMINI_API_KEY
      ? GEMINI_MODEL
      : 'NOT CONFIGURED'
  }`
);

console.log(
  `🔥 Groq: ${
    GROQ_API_KEY
      ? GROQ_MODEL
      : 'NOT CONFIGURED'
  }`
);

console.log(
  `🤖 OpenAI: ${
    OPENAI_API_KEY
      ? OPENAI_MODEL
      : 'NOT CONFIGURED'
  }`
);

console.log('================================');

// =====================================================
// CLEAN MESSAGE
// =====================================================

function cleanMessage(message) {
  if (!message) return '';
  return String(message).trim();
}

// =====================================================
// GEMINI TEXT
// =====================================================

async function runGemini(message) {
  if (!gemini) {
    throw new Error(
      'Gemini API key is not configured'
    );
  }

  const response =
    await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: message
    });

  const reply = response.text;

  if (!reply) {
    throw new Error(
      'Gemini returned empty response'
    );
  }

  return reply;
}

// =====================================================
// GROQ
// =====================================================

async function runGroq(message) {
  if (!GROQ_API_KEY) {
    throw new Error(
      'Groq API key is not configured'
    );
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model: GROQ_MODEL,

        messages: [
          {
            role: 'system',
            content:
              'You are Infinity AI, a helpful, accurate and clear AI assistant.'
          },

          {
            role: 'user',
            content: message
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const error =
      await response.text();

    throw new Error(
      `Groq ${response.status}: ${error}`
    );
  }

  const data =
    await response.json();

  const reply =
    data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error(
      'Groq returned empty response'
    );
  }

  return reply;
}

// =====================================================
// OPENAI
// No OpenAI npm package required
// =====================================================

async function runOpenAI(message) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OpenAI API key is not configured'
    );
  }

  const response = await fetch(
    'https://api.openai.com/v1/responses',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${OPENAI_API_KEY}`
      },

      body: JSON.stringify({
        model: OPENAI_MODEL,

        instructions:
          'You are Infinity AI, a helpful, accurate and clear AI assistant. Answer naturally and directly.',

        input: message
      })
    }
  );

  if (!response.ok) {
    const error =
      await response.text();

    throw new Error(
      `OpenAI ${response.status}: ${error}`
    );
  }

  const data =
    await response.json();

  let reply = data?.output_text;

  // Extra fallback for Responses API output format
  if (!reply && Array.isArray(data?.output)) {
    reply = data.output
      .flatMap(item =>
        Array.isArray(item?.content)
          ? item.content
          : []
      )
      .map(item =>
        item?.text || ''
      )
      .filter(Boolean)
      .join('\n');
  }

  if (!reply) {
    throw new Error(
      'OpenAI returned empty response'
    );
  }

  return reply;
}

// =====================================================
// GEMINI VISION
// =====================================================

async function runGeminiVision(
  message,
  image,
  mimeType
) {
  if (!gemini) {
    throw new Error(
      'Gemini API key is not configured'
    );
  }

  const response =
    await gemini.models.generateContent({
      model: GEMINI_MODEL,

      contents: [
        {
          inlineData: {
            mimeType:
              mimeType || 'image/jpeg',

            data: image
          }
        },

        {
          text:
            message ||
            'Analyze this image carefully and explain what you see.'
        }
      ]
    });

  const reply = response.text;

  if (!reply) {
    throw new Error(
      'Gemini Vision returned empty response'
    );
  }

  return reply;
}

// =====================================================
// GEMINI PDF
// =====================================================

async function runGeminiPDF(
  message,
  pdf,
  mimeType
) {
  if (!gemini) {
    throw new Error(
      'Gemini API key is not configured'
    );
  }

  const response =
    await gemini.models.generateContent({
      model: GEMINI_MODEL,

      contents: [
        {
          inlineData: {
            mimeType:
              mimeType ||
              'application/pdf',

            data: pdf
          }
        },

        {
          text:
            message ||
            'Analyze this PDF and explain its contents clearly.'
        }
      ]
    });

  const reply = response.text;

  if (!reply) {
    throw new Error(
      'Gemini PDF returned empty response'
    );
  }

  return reply;
}

// =====================================================
// HEALTH
// =====================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',

    service: 'Infinity AI Backend',

    providers: {
      gemini: Boolean(GEMINI_API_KEY),
      groq: Boolean(GROQ_API_KEY),
      openai: Boolean(OPENAI_API_KEY)
    },

    models: {
      gemini: GEMINI_MODEL,
      groq: GROQ_MODEL,
      openai: OPENAI_MODEL
    },

    timestamp:
      new Date().toISOString()
  });
});

// =====================================================
// CHAT
// =====================================================

app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      capability,
      image,
      imageMimeType,
      pdf,
      pdfMimeType,
      fileName
    } = req.body;

    const userMessage =
      cleanMessage(message);

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !userMessage &&
      !image &&
      !pdf
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Message, image or PDF is required'
      });
    }

    // =================================================
    // PDF
    // =================================================

    if (pdf) {
      console.log(
        `📄 PDF request${
          fileName
            ? `: ${fileName}`
            : ''
        }`
      );

      const reply =
        await runGeminiPDF(
          userMessage,
          pdf,
          pdfMimeType
        );

      return res.json({
        success: true,
        provider: 'Gemini',
        type: 'pdf',
        reply
      });
    }

    // =================================================
    // IMAGE
    // =================================================

    if (image) {
      console.log(
        '👁️ Image understanding request'
      );

      const reply =
        await runGeminiVision(
          userMessage,
          image,
          imageMimeType
        );

      return res.json({
        success: true,
        provider: 'Gemini Vision',
        type: 'image',
        reply
      });
    }

    // =================================================
    // DIRECT CHATGPT
    // =================================================

    if (
      capability === 'chatgpt' ||
      capability === 'openai' ||
      capability === 'ChatGPT'
    ) {
      console.log(
        '🤖 Direct OpenAI request'
      );

      try {
        const reply =
          await runOpenAI(
            userMessage
          );

        return res.json({
          success: true,
          provider: 'OpenAI',
          model: OPENAI_MODEL,
          reply
        });

      } catch (error) {
        console.error(
          '❌ OpenAI failed:',
          error.message
        );

        return res.status(503).json({
          success: false,
          provider: 'OpenAI',
          error:
            'OpenAI service is currently unavailable.'
        });
      }
    }

    // =================================================
    // 1️⃣ GEMINI MAIN
    // =================================================

    if (gemini) {
      try {
        console.log(
          '🧠 Gemini request'
        );

        const reply =
          await runGemini(
            userMessage
          );

        return res.json({
          success: true,
          provider: 'Gemini',
          model: GEMINI_MODEL,
          reply
        });

      } catch (error) {
        console.error(
          '❌ Gemini failed:',
          error.message
        );
      }
    }

    // =================================================
    // 2️⃣ GROQ FALLBACK
    // =================================================

    if (GROQ_API_KEY) {
      try {
        console.log(
          '🔥 Groq fallback'
        );

        const reply =
          await runGroq(
            userMessage
          );

        return res.json({
          success: true,
          provider: 'Groq',
          model: GROQ_MODEL,
          reply
        });

      } catch (error) {
        console.error(
          '❌ Groq failed:',
          error.message
        );
      }
    }

    // =================================================
    // 3️⃣ OPENAI FALLBACK
    // =================================================

    if (OPENAI_API_KEY) {
      try {
        console.log(
          '🤖 OpenAI fallback'
        );

        const reply =
          await runOpenAI(
            userMessage
          );

        return res.json({
          success: true,
          provider: 'OpenAI',
          model: OPENAI_MODEL,
          reply
        });

      } catch (error) {
        console.error(
          '❌ OpenAI failed:',
          error.message
        );
      }
    }

    // =================================================
    // ALL FAILED
    // =================================================

    return res.status(503).json({
      success: false,
      error:
        'All AI services are currently unavailable.'
    });

  } catch (error) {
    console.error(
      '❌ Server error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      error:
        'AI service error. Please try again later.'
    });
  }
});

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `✅ Server running on http://localhost:${PORT}`
    );
  }
);
