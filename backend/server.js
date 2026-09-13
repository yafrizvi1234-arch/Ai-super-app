require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = Number(process.env.PORT) || 10000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// =====================================================
// AI CONFIG
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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// =====================================================
// GEMINI
// =====================================================

let gemini = null;

if (GEMINI_API_KEY) {
  gemini = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });
}

// =====================================================
// OPENAI
// =====================================================

let openai = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
}

// =====================================================
// STARTUP LOG
// =====================================================

console.log('==========================================');
console.log('🚀 INFINITY AI BACKEND');
console.log('==========================================');

console.log(
  `🧠 Gemini: ${GEMINI_API_KEY ? GEMINI_MODEL : 'NOT CONFIGURED'}`
);

console.log(
  `🔥 Groq: ${GROQ_API_KEY ? GROQ_MODEL : 'NOT CONFIGURED'}`
);

console.log(
  `🤖 OpenAI: ${OPENAI_API_KEY ? OPENAI_MODEL : 'NOT CONFIGURED'}`
);

console.log('==========================================');

// =====================================================
// HELPER
// =====================================================

function cleanMessage(message) {
  if (!message) return '';

  return String(message).trim();
}

// =====================================================
// GEMINI TEXT
// =====================================================

async function runGemini(userMessage) {
  if (!gemini) {
    throw new Error('Gemini API key is not configured');
  }

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: userMessage
  });

  const reply = response.text;

  if (!reply) {
    throw new Error('Gemini returned an empty response');
  }

  return reply;
}

// =====================================================
// GROQ FALLBACK
// =====================================================

async function runGroq(userMessage) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured');
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model: GROQ_MODEL,

        messages: [
          {
            role: 'system',
            content:
              'You are Infinity AI, a helpful, accurate and clear AI assistant. Answer naturally and directly.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Groq API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const reply =
    data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error('Groq returned an empty response');
  }

  return reply;
}

// =====================================================
// OPENAI
// =====================================================

async function runOpenAI(userMessage) {
  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await openai.responses.create({
    model: OPENAI_MODEL,

    input: [
      {
        role: 'system',
        content:
          'You are Infinity AI, a helpful, accurate and clear AI assistant. Answer naturally and directly.'
      },

      {
        role: 'user',
        content: userMessage
      }
    ]
  });

  const reply = response.output_text;

  if (!reply) {
    throw new Error('OpenAI returned an empty response');
  }

  return reply;
}

// =====================================================
// GEMINI IMAGE UNDERSTANDING
// =====================================================

async function runGeminiVision(
  userMessage,
  imageBase64,
  imageMimeType
) {
  if (!gemini) {
    throw new Error('Gemini API key is not configured');
  }

  if (!imageBase64) {
    throw new Error('Image data is missing');
  }

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,

    contents: [
      {
        inlineData: {
          mimeType:
            imageMimeType || 'image/jpeg',

          data: imageBase64
        }
      },

      {
        text:
          userMessage ||
          'Analyze this image carefully and explain what you see.'
      }
    ]
  });

  const reply = response.text;

  if (!reply) {
    throw new Error(
      'Gemini Vision returned an empty response'
    );
  }

  return reply;
}

// =====================================================
// GEMINI PDF UNDERSTANDING
// =====================================================

async function runGeminiPDF(
  userMessage,
  pdfBase64,
  pdfMimeType
) {
  if (!gemini) {
    throw new Error('Gemini API key is not configured');
  }

  if (!pdfBase64) {
    throw new Error('PDF data is missing');
  }

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,

    contents: [
      {
        inlineData: {
          mimeType:
            pdfMimeType || 'application/pdf',

          data: pdfBase64
        }
      },

      {
        text:
          userMessage ||
          'Analyze this PDF and explain its contents clearly.'
      }
    ]
  });

  const reply = response.text;

  if (!reply) {
    throw new Error(
      'Gemini PDF analysis returned an empty response'
    );
  }

  return reply;
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',

    service: 'Infinity AI Backend',

    providers: {
      gemini: !!GEMINI_API_KEY,
      groq: !!GROQ_API_KEY,
      openai: !!OPENAI_API_KEY
    },

    models: {
      gemini: GEMINI_MODEL,
      groq: GROQ_MODEL,
      openai: OPENAI_MODEL
    },

    timestamp: new Date().toISOString()
  });
});

// =====================================================
// MAIN CHAT API
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

    const userMessage = cleanMessage(message);

    // -------------------------------------------------
    // Validate
    // -------------------------------------------------

    if (!userMessage && !image && !pdf) {
      return res.status(400).json({
        error: 'Message, image or PDF is required'
      });
    }

    // =================================================
    // PDF
    // =================================================

    if (pdf) {
      console.log(
        `📄 PDF request${fileName ? `: ${fileName}` : ''}`
      );

      const reply = await runGeminiPDF(
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
      console.log('👁️ Image understanding request');

      const reply = await runGeminiVision(
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
    // DIRECT CHATGPT / OPENAI
    // =================================================

    if (
      capability === 'chatgpt' ||
      capability === 'openai' ||
      capability === 'ChatGPT'
    ) {
      console.log('🤖 Direct OpenAI request');

      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'OpenAI is not configured'
        });
      }

      const reply = await runOpenAI(userMessage);

      return res.json({
        success: true,
        provider: 'OpenAI',
        model: OPENAI_MODEL,
        reply
      });
    }

    // =================================================
    // NORMAL AI ROUTING
    // =================================================

    // 1️⃣ Gemini MAIN

    if (gemini) {
      try {
        console.log('🧠 Gemini request');

        const reply =
          await runGemini(userMessage);

        return res.json({
          success: true,
          provider: 'Gemini',
          model: GEMINI_MODEL,
          reply
        });

      } catch (geminiError) {
        console.error(
          '❌ Gemini failed:',
          geminiError.message
        );
      }
    }

    // 2️⃣ Groq FALLBACK

    if (GROQ_API_KEY) {
      try {
        console.log('🔥 Groq fallback');

        const reply =
          await runGroq(userMessage);

        return res.json({
          success: true,
          provider: 'Groq',
          model: GROQ_MODEL,
          reply
        });

      } catch (groqError) {
        console.error(
          '❌ Groq failed:',
          groqError.message
        );
      }
    }

    // 3️⃣ OpenAI FALLBACK

    if (openai) {
      try {
        console.log('🤖 OpenAI fallback');

        const reply =
          await runOpenAI(userMessage);

        return res.json({
          success: true,
          provider: 'OpenAI',
          model: OPENAI_MODEL,
          reply
        });

      } catch (openaiError) {
        console.error(
          '❌ OpenAI failed:',
          openaiError.message
        );
      }
    }

    // =================================================
    // EVERYTHING FAILED
    // =================================================

    return res.status(503).json({
      success: false,
      error:
        'All AI services are currently unavailable.'
    });

  } catch (error) {
    console.error(
      '❌ Server error:',
      error
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
    error: 'Endpoint not found'
  });
});

// =====================================================
// START SERVER
// =====================================================

// IMPORTANT FOR RENDER:
// Listen on 0.0.0.0 so Render can detect the port.

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `✅ Infinity AI server running on port ${PORT}`
  );
});
