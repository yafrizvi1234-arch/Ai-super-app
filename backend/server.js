require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================
   SERVER CONFIG
========================= */

const PORT = Number(process.env.PORT) || 10000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

/* =========================
   AI MODELS
========================= */

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.7-flash";

const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.6-luna";

/* =========================
   API KEYS
========================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/* =========================
   GEMINI CLIENT
========================= */

const genAI = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

/* =========================
   STARTUP LOG
========================= */

console.log("=================================");
console.log("🚀 Infinity AI Backend Starting");
console.log("=================================");

console.log("Port:", PORT);
console.log("Gemini Key:", !!GEMINI_API_KEY);
console.log("Groq Key:", !!GROQ_API_KEY);
console.log("OpenAI Key:", !!OPENAI_API_KEY);

console.log("Gemini Model:", GEMINI_MODEL);
console.log("Groq Model:", GROQ_MODEL);
console.log("OpenAI Model:", OPENAI_MODEL);

console.log("=================================");

/* =========================
   HELPERS
========================= */

function cleanMessage(message) {
  return String(message || "").trim();
}

function normalizeCapability(value) {
  const v = String(value || "gemini")
    .trim()
    .toLowerCase();

  // ChatGPT / OpenAI
  if (
    v === "chatgpt" ||
    v === "openai" ||
    v.includes("chatgpt")
  ) {
    return "chatgpt";
  }

  // Groq
  if (
    v === "groq" ||
    v.includes("groq")
  ) {
    return "groq";
  }

  // Everything else defaults to Gemini
  return "gemini";
}

/* =========================
   GEMINI TEXT
========================= */

async function runGemini(message) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: message,
  });

  const reply =
    response?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (!reply) {
    throw new Error("Gemini returned an empty response.");
  }

  return reply;
}

/* =========================
   GROQ TEXT
========================= */

async function runGroq(message) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },

      body: JSON.stringify({
        model: GROQ_MODEL,

        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `Groq request failed with status ${response.status}`
    );
  }

  const reply =
    data?.choices?.[0]?.message?.content || "";

  if (!reply) {
    throw new Error("Groq returned an empty response.");
  }

  return reply;
}

/* =========================
   OPENAI / CHATGPT
========================= */

async function runOpenAI(message) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },

      body: JSON.stringify({
        model: OPENAI_MODEL,

        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: message,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `OpenAI request failed with status ${response.status}`
    );
  }

  let reply = "";

  if (typeof data?.output_text === "string") {
    reply = data.output_text;
  }

  if (!reply && Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) continue;

      for (const part of item.content) {
        if (typeof part?.text === "string") {
          reply += part.text;
        }
      }
    }
  }

  reply = reply.trim();

  if (!reply) {
    throw new Error("OpenAI returned an empty response.");
  }

  return reply;
}

/* =========================
   GEMINI IMAGE
========================= */

async function runGeminiVision(
  message,
  imageBase64,
  imageMimeType
) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!imageBase64) {
    throw new Error("Image data is missing.");
  }

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,

    contents: [
      {
        role: "user",

        parts: [
          {
            text:
              message ||
              "Analyze this image and explain what you see.",
          },

          {
            inlineData: {
              mimeType:
                imageMimeType || "image/jpeg",

              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  const reply =
    response?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (!reply) {
    throw new Error(
      "Gemini image analysis returned an empty response."
    );
  }

  return reply;
}

/* =========================
   GEMINI PDF
========================= */

async function runGeminiPDF(
  message,
  pdfBase64,
  pdfMimeType,
  fileName
) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!pdfBase64) {
    throw new Error("PDF data is missing.");
  }

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,

    contents: [
      {
        role: "user",

        parts: [
          {
            text:
              message ||
              `Analyze this PDF${
                fileName ? ` (${fileName})` : ""
              } and explain the important information.`,
          },

          {
            inlineData: {
              mimeType:
                pdfMimeType || "application/pdf",

              data: pdfBase64,
            },
          },
        ],
      },
    ],
  });

  const reply =
    response?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (!reply) {
    throw new Error(
      "Gemini PDF analysis returned an empty response."
    );
  }

  return reply;
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",

    service: "Infinity AI Backend",

    providers: {
      gemini: !!GEMINI_API_KEY,
      groq: !!GROQ_API_KEY,
      openai: !!OPENAI_API_KEY,
    },

    models: {
      gemini: GEMINI_MODEL,
      groq: GROQ_MODEL,
      openai: OPENAI_MODEL,
    },

    capabilities: {
      infinity_ai_core: !!GEMINI_API_KEY,
      chatgpt: !!OPENAI_API_KEY,
      groq: !!GROQ_API_KEY,
      pdf: !!GEMINI_API_KEY,
      image: !!GEMINI_API_KEY,
    },

    timestamp: new Date().toISOString(),
  });
});

/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      capability,
      image,
      imageMimeType,
      pdf,
      pdfMimeType,
      fileName,
    } = req.body;

    const userMessage = cleanMessage(message);

    if (
      !userMessage &&
      !image &&
      !pdf
    ) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
      });
    }

    const selectedCapability =
      normalizeCapability(capability);

    console.log("=================================");
    console.log("📩 New request");
    console.log("Capability:", selectedCapability);
    console.log("Has Image:", !!image);
    console.log("Has PDF:", !!pdf);
    console.log("=================================");

    /* =========================
       PDF
       =========================
       PDF currently uses Gemini
    */

    if (pdf) {
      console.log(
        "📄 PDF request → Gemini"
      );

      const reply = await runGeminiPDF(
        userMessage,
        pdf,
        pdfMimeType,
        fileName
      );

      return res.json({
        success: true,
        provider: "Gemini",
        model: GEMINI_MODEL,
        capability: "gemini",
        reply,
      });
    }

    /* =========================
       IMAGE
       =========================
       Image currently uses Gemini Vision
    */

    if (image) {
      console.log(
        "🖼️ Image request → Gemini Vision"
      );

      const reply = await runGeminiVision(
        userMessage,
        image,
        imageMimeType
      );

      return res.json({
        success: true,
        provider: "Gemini",
        model: GEMINI_MODEL,
        capability: "gemini",
        reply,
      });
    }

    /* =========================
       DIRECT CHATGPT
    ========================= */

    if (selectedCapability === "chatgpt") {
      console.log(
        "🤖 Direct provider → OpenAI / ChatGPT"
      );

      const reply = await runOpenAI(
        userMessage
      );

      return res.json({
        success: true,
        provider: "OpenAI",
        model: OPENAI_MODEL,
        capability: "chatgpt",
        reply,
      });
    }

    /* =========================
       DIRECT GROQ
    ========================= */

    if (selectedCapability === "groq") {
      console.log(
        "⚡ Direct provider → Groq"
      );

      const reply = await runGroq(
        userMessage
      );

      return res.json({
        success: true,
        provider: "Groq",
        model: GROQ_MODEL,
        capability: "groq",
        reply,
      });
    }

    /* =========================
       GEMINI
    ========================= */

    console.log(
      "✨ Direct provider → Gemini"
    );

    try {
      const reply = await runGemini(
        userMessage
      );

      return res.json({
        success: true,
        provider: "Gemini",
        model: GEMINI_MODEL,
        capability: "gemini",
        reply,
      });
    } catch (geminiError) {
      console.error(
        "❌ Gemini failed:",
        geminiError.message
      );

      /* =========================
         GROQ FALLBACK
      ========================= */

      if (GROQ_API_KEY) {
        try {
          console.log(
            "🔄 Gemini failed → Groq fallback"
          );

          const reply = await runGroq(
            userMessage
          );

          return res.json({
            success: true,
            provider: "Groq",
            model: GROQ_MODEL,
            capability: "groq-fallback",
            reply,
          });
        } catch (groqError) {
          console.error(
            "❌ Groq fallback failed:",
            groqError.message
          );
        }
      }

      /* =========================
         OPENAI FALLBACK
      ========================= */

      if (OPENAI_API_KEY) {
        try {
          console.log(
            "🔄 Gemini/Groq failed → OpenAI fallback"
          );

          const reply = await runOpenAI(
            userMessage
          );

          return res.json({
            success: true,
            provider: "OpenAI",
            model: OPENAI_MODEL,
            capability: "chatgpt-fallback",
            reply,
          });
        } catch (openAIError) {
          console.error(
            "❌ OpenAI fallback failed:",
            openAIError.message
          );
        }
      }

      return res.status(500).json({
        success: false,

        error:
          "All AI providers failed.",

        details: geminiError.message,
      });
    }
  } catch (error) {
    console.error(
      "🔥 /api/chat error:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Internal server error.",
    });
  }
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
  });
});

/* =========================
   START SERVER
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `✅ Infinity AI Backend running on port ${PORT}`
    );
  }
);
