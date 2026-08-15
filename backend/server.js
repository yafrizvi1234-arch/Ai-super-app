require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// AI SUPER APP
// Gemini = MAIN BRAIN
// Groq = FALLBACK AI
// =====================================================

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Groq model is written here directly.
// You can change it later if needed.
const GROQ_MODEL =
  process.env.GROQ_MODEL || 'openai/gpt-oss-20b';


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// GEMINI API KEY
// =====================================================

const geminiApiKey =
  process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error(
    '❌ GEMINI_API_KEY is not set.'
  );

  process.exit(1);
}

const genAI =
  new GoogleGenAI({
    apiKey: geminiApiKey
  });


// =====================================================
// GROQ API KEY
// =====================================================

// Groq key is OPTIONAL.
// If it is missing, Gemini will continue working normally.

const groqApiKey =
  process.env.GROQ_API_KEY;

if (groqApiKey) {
  console.log('✅ Groq fallback is configured.');
} else {
  console.log(
    'ℹ️ GROQ_API_KEY not found. Groq fallback is disabled.'
  );
}


// =====================================================
// GEMINI TEST TOOL
// =====================================================

const getAppStatusTool = {
  type: 'function',

  name: 'get_app_status',

  description:
    'Returns the current status of the AI Super App backend. Use this when the user asks whether the app or backend is working.',

  parameters: {
    type: 'object',

    properties: {},

    required: []
  }
};


// =====================================================
// TOOL EXECUTION
// =====================================================

function getAppStatus() {

  return {

    status: 'online',

    router: 'active',

    mainBrain: 'Gemini',

    groqFallback:
      groqApiKey ? 'configured' : 'disabled',

    testTool: 'working'

  };
}


// =====================================================
// GEMINI BRAIN
// =====================================================

async function runGeminiBrain(userMessage) {

  let input = userMessage;

  let previousInteractionId = null;

  // Maximum 3 tool rounds
  for (let round = 0; round < 3; round++) {

    const interaction =
      await genAI.interactions.create({

        model: GEMINI_MODEL,

        input,

        tools: [
          getAppStatusTool
        ],

        previous_interaction_id:
          previousInteractionId

      });


    const functionResults = [];


    for (const step of interaction.steps) {

      if (step.type === 'function_call') {

        console.log(
          `🧠 Gemini requested tool: ${step.name}`
        );


        let result;


        if (
          step.name ===
          'get_app_status'
        ) {

          result =
            getAppStatus();

        } else {

          result = {
            error: 'Unknown tool'
          };

        }


        functionResults.push({

          type: 'function_result',

          name: step.name,

          call_id: step.id,

          result: [
            {
              type: 'text',

              text:
                JSON.stringify(result)
            }
          ]

        });

      }

    }


    // Gemini gave final answer
    if (functionResults.length === 0) {

      return interaction.output_text;

    }


    // Send tool result back to Gemini
    input =
      functionResults;

    previousInteractionId =
      interaction.id;

  }


  throw new Error(
    'Gemini tool execution limit reached.'
  );
}


// =====================================================
// GROQ FALLBACK
// =====================================================

async function runGroqFallback(userMessage) {

  if (!groqApiKey) {

    throw new Error(
      'GROQ_API_KEY is not configured.'
    );

  }


  console.log(
    `🔄 Switching to Groq: ${GROQ_MODEL}`
  );


  const response =
    await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json',

          'Authorization':
            `Bearer ${groqApiKey}`

        },

        body: JSON.stringify({

          model: GROQ_MODEL,

          messages: [

            {
              role: 'system',

              content:
                'You are the fallback AI assistant of an AI Super App. Give helpful, accurate and concise answers.'
            },

            {
              role: 'user',

              content:
                userMessage
            }

          ]

        })

      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Groq API error ${response.status}: ${errorText}`
    );

  }


  const data =
    await response.json();


  const reply =
    data?.choices?.[0]?.message?.content;


  if (!reply) {

    throw new Error(
      'Groq returned an empty response.'
    );

  }


  return reply;
}


// =====================================================
// SMART AI ROUTER
// =====================================================

async function getAIReply(userMessage) {

  // ---------------------------------------------------
  // 1. Try Gemini first
  // ---------------------------------------------------

  try {

    console.log(
      '🧠 Trying Gemini...'
    );


    const reply =
      await runGeminiBrain(
        userMessage
      );


    console.log(
      '✅ Gemini answered successfully.'
    );


    return {

      reply,

      provider: 'gemini',

      brain: 'gemini',

      fallbackUsed: false

    };

  }

  catch (geminiError) {

    console.error(
      '❌ Gemini failed:',
      geminiError.message ||
      geminiError
    );


    // -------------------------------------------------
    // 2. Try Groq
    // -------------------------------------------------

    if (groqApiKey) {

      try {

        const reply =
          await runGroqFallback(
            userMessage
          );


        console.log(
          '✅ Groq fallback answered successfully.'
        );


        return {

          reply,

          provider: 'groq',

          brain: 'gemini',

          fallbackUsed: true

        };

      }

      catch (groqError) {

        console.error(
          '❌ Groq fallback failed:',
          groqError.message ||
          groqError
        );

      }

    }


    // Both failed
    throw new Error(
      'Both Gemini and Groq failed.'
    );

  }

}


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({

      status: 'ok',

      router: 'active',

      mainBrain: 'gemini',

      providers: {

        gemini: 'active',

        groq:
          groqApiKey
            ? 'configured'
            : 'not-configured'

      },

      models: {

        gemini:
          GEMINI_MODEL,

        groq:
          GROQ_MODEL

      },

      timestamp:
        new Date().toISOString()

    });

  }
);


// =====================================================
// CHAT API
// =====================================================

app.post(
  '/api/chat',
  async (req, res) => {

    try {

      const { message } =
        req.body;


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


      console.log(
        `💬 User: ${message.trim()}`
      );


      const result =
        await getAIReply(
          message.trim()
        );


      res.json(result);

    }

    catch (error) {

      console.error(
        '❌ AI Router Error:',
        error.message ||
        error
      );


      res.status(500).json({

        error:
          'AI response failed. Please try again later.'

      });

    }

  }
);


// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({

      error:
        'Endpoint not found'

    });

  }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'Unhandled error:',
      err
    );


    res.status(500).json({

      error:
        'Internal server error'

    });

  }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log(
      `✅ Server running on http://localhost:${PORT}`
    );

    console.log(
      `🧠 Main Brain: Gemini (${GEMINI_MODEL})`
    );

    console.log(
      `🔥 Fallback: Groq (${GROQ_MODEL})`
    );

  }
);
