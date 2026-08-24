require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// INFINITY AI
// Gemini = MAIN BRAIN
// Groq = FALLBACK AI
// Gemini Vision = IMAGE UNDERSTANDING
// =====================================================

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const GROQ_MODEL =
  process.env.GROQ_MODEL || 'openai/gpt-oss-20b';


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

/*
  Image base64 data can be large.
  25mb is only a server request limit.
  Gemini's own supported limits still apply.
*/
app.use(
  express.json({
    limit: '25mb'
  })
);


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

const groqApiKey =
  process.env.GROQ_API_KEY;

if (groqApiKey) {

  console.log(
    '✅ Groq fallback is configured.'
  );

} else {

  console.log(
    'ℹ️ GROQ_API_KEY not found. Groq fallback is disabled.'
  );

}


// =====================================================
// GEMINI APP STATUS TOOL
// =====================================================

const getAppStatusTool = {

  type: 'function',

  name: 'get_app_status',

  description:
    'Returns the current status of the Infinity AI backend.',

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

    vision: 'active',

    groqFallback:
      groqApiKey
        ? 'configured'
        : 'disabled',

    testTool: 'working'

  };

}


// =====================================================
// GEMINI BRAIN — TEXT
// =====================================================

async function runGeminiBrain(userMessage) {

  let input = userMessage;

  let previousInteractionId = null;

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


    for (
      const step of interaction.steps || []
    ) {

      if (
        step.type === 'function_call'
      ) {

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


    if (
      functionResults.length === 0
    ) {

      return (
        interaction.output_text ||
        'Infinity AI could not generate a response.'
      );

    }


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
// GEMINI VISION
// IMAGE + TEXT
// =====================================================

async function runGeminiVision(
  userMessage,
  imageData,
  mimeType
) {

  if (!imageData) {

    throw new Error(
      'Image data is missing.'
    );

  }


  /*
    Accept both:

    1. Pure base64
    2. data:image/jpeg;base64,XXXX
  */

  let base64Image =
    String(imageData);


  if (
    base64Image.includes(
      'base64,'
    )
  ) {

    base64Image =
      base64Image.split(
        'base64,'
      )[1];

  }


  if (!base64Image) {

    throw new Error(
      'Invalid image data.'
    );

  }


  const safeMimeType =
    (
      typeof mimeType === 'string' &&
      mimeType.startsWith('image/')
    )
      ? mimeType
      : 'image/jpeg';


  console.log(
    `🖼️ Gemini Vision: ${safeMimeType}`
  );


  /*
    Gemini Interactions API supports
    multimodal input:
    text + image.
  */

  const interaction =
    await genAI.interactions.create({

      model: GEMINI_MODEL,

      input: [

        {

          type: 'text',

          text:
            `You are Infinity AI.

The user has provided an image.

Analyze the image carefully and answer the user's question.

User question:
${userMessage}

If the user asks about text in the image, read the visible text carefully.

If the user asks what is in the image, describe the important visible elements.

If the user asks about a chart, diagram, screenshot, or document, explain what can actually be understood from the image.

Do not claim to see something that is not visible.

Answer naturally and helpfully.`

        },

        {

          type: 'image',

          data:
            base64Image,

          mime_type:
            safeMimeType

        }

      ]

    });


  const reply =
    interaction.output_text;


  if (!reply) {

    throw new Error(
      'Gemini Vision returned an empty response.'
    );

  }


  console.log(
    '✅ Gemini Vision answered successfully.'
  );


  return reply;

}


// =====================================================
// GROQ FALLBACK
// TEXT ONLY
// =====================================================

async function runGroqFallback(
  userMessage
) {

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

          model:
            GROQ_MODEL,

          messages: [

            {

              role: 'system',

              content:
                'You are Infinity AI, a helpful and accurate AI assistant. Give clear answers.'

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
// SMART TEXT ROUTER
// =====================================================

async function getAIReply(
  userMessage
) {

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


    throw new Error(
      'Both Gemini and Groq failed.'
    );

  }

}


// =====================================================
// SMART VISION ROUTER
// =====================================================

async function getVisionReply(
  userMessage,
  imageData,
  mimeType
) {

  /*
    Vision request:
    Gemini Vision first.
  */

  try {

    console.log(
      '🖼️ Trying Gemini Vision...'
    );


    const reply =
      await runGeminiVision(

        userMessage,

        imageData,

        mimeType

      );


    return {

      reply,

      provider: 'gemini',

      brain: 'gemini',

      vision: true,

      fallbackUsed: false

    };

  }

  catch (geminiError) {

    console.error(
      '❌ Gemini Vision failed:',
      geminiError.message ||
      geminiError
    );


    /*
      Important:

      Groq fallback here is intentionally NOT
      used for image understanding because your
      current Groq fallback is text-only.
    */

    throw new Error(
      'Gemini Vision failed. Image could not be analyzed.'
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

      vision: 'active',

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
// Supports:
// 1. Text only
// 2. Image + text
// =====================================================

app.post(
  '/api/chat',
  async (req, res) => {

    try {

      const {
        message,
        image,
        imageMimeType
      } = req.body;


      // =================================================
      // IMAGE REQUEST
      // =================================================

      if (image) {

        if (
          !message ||
          typeof message !== 'string'
        ) {

          return res.status(400).json({

            error:
              'Please provide a question/message with the image.'

          });

        }


        console.log(
          `🖼️ Image request: ${message.trim()}`
        );


        const result =
          await getVisionReply(

            message.trim(),

            image,

            imageMimeType

          );


        return res.json(
          result
        );

      }


      // =================================================
      // NORMAL TEXT REQUEST
      // =================================================

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


      return res.json(
        result
      );

    }

    catch (error) {

      console.error(
        '❌ AI Router Error:',
        error.message ||
        error
      );


      return res.status(500).json({

        error:
          'Infinity AI could not process the request. Please try again.'

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
      `👁️ Vision: Gemini Vision (${GEMINI_MODEL})`
    );

    console.log(
      `🔥 Fallback: Groq (${GROQ_MODEL})`
    );

  }
);
