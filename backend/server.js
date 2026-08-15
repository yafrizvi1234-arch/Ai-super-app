require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// AI SUPER APP
// Gemini = Main Brain
// Test Tool = get_app_status
// =====================================================

const MODEL_NAME =
  process.env.GEMINI_MODEL || 'gemini-3.6-flash';

app.use(cors());
app.use(express.json());

// =====================================================
// GEMINI API KEY
// =====================================================

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    '❌ GEMINI_API_KEY environment variable is not set.'
  );
  process.exit(1);
}

const genAI = new GoogleGenAI({
  apiKey
});

// =====================================================
// TEST TOOL DEFINITION
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
    testTool: 'working'
  };
}

// =====================================================
// GEMINI BRAIN
// =====================================================

async function runGeminiBrain(userMessage) {

  let input = userMessage;
  let previousInteractionId = null;

  // Allow a few tool rounds
  for (let round = 0; round < 3; round++) {

    const interaction =
      await genAI.interactions.create({

        model: MODEL_NAME,

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

        if (step.name === 'get_app_status') {

          result = getAppStatus();

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
              text: JSON.stringify(result)
            }
          ]

        });
      }
    }

    // No tool requested → final answer
    if (functionResults.length === 0) {

      return interaction.output_text;
    }

    // Send tool results back to Gemini
    input = functionResults;

    previousInteractionId =
      interaction.id;
  }

  return 'Tool execution limit reached. Please try again.';
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req, res) => {

  res.json({

    status: 'ok',

    router: 'active',

    mainBrain: 'gemini',

    tools: [
      'get_app_status'
    ],

    timestamp:
      new Date().toISOString()

  });

});

// =====================================================
// CHAT API
// =====================================================

app.post('/api/chat', async (req, res) => {

  try {

    const { message } = req.body;

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

    const reply =
      await runGeminiBrain(
        message.trim()
      );

    res.json({

      reply,

      provider: 'gemini',

      brain: 'gemini'

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
// 404
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
    '🧠 Gemini Brain: ACTIVE'
  );

  console.log(
    '🛠️ Test Tool: get_app_status'
  );

});
