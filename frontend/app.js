/* =========================================================
   INFINITY AI — FRONTEND APP.JS
   Features:
   - Gemini
   - ChatGPT / OpenAI
   - Groq
   - Web Search
   - Chat History
   - Markdown
   - Code blocks + Copy
   - Typing animation
   - Gallery
   - Camera
   - Image Understanding
   - PDF Analysis
========================================================= */


/* =========================================================
   API
========================================================= */

const API_URL =
  "https://ai-super-app-3fr7.onrender.com/api/chat";


/* =========================================================
   AI CAPABILITIES
========================================================= */

const AI_CAPABILITIES = [
  {
    value: "gemini",
    label: "Infinity AI Core"
  },

  {
    value: "chatgpt",
    label: "ChatGPT"
  },

  {
    value: "groq",
    label: "Groq"
  },

  {
    value: "websearch",
    label: "🌐 Web Search"
  },

  {
    value: "deep",
    label: "Deep Reasoning"
  },

  {
    value: "advanced",
    label: "Advanced Assistant"
  },

  {
    value: "creative",
    label: "Creative Intelligence"
  },

  {
    value: "long",
    label: "Long Context AI"
  },

  {
    value: "web",
    label: "Web Intelligence"
  }
];


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   DOM ELEMENTS
========================================================= */

const messageInput =
  $("messageInput");

const sendButton =
  $("sendButton");

const chatContainer =
  $("chatContainer");

const modelSelector =
  $("aiModel") ||
  $("modelSelector") ||
  $("modelSelect");

const plusMenu =
  $("plusMenu");

const plusButton =
  $("plusButton");

const fileInput =
  $("fileInput");

const imageInput =
  $("imageInput");

const pdfInput =
  $("pdfInput");

const cameraInput =
  $("cameraInput");

const galleryInput =
  $("galleryInput");

const webSearchButton =
  $("webSearchBtn");


/* =========================================================
   STATE
========================================================= */

let selectedFile = null;
let selectedFileType = null;

let selectedImage = null;
let selectedImageMimeType = null;

let selectedPDF = null;
let selectedPDFMimeType = null;
let selectedPDFName = null;

let isSending = false;


/* =========================================================
   HISTORY
========================================================= */

const HISTORY_KEY =
  "infinity_ai_chat_history";


function getHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
  } catch {
    return [];
  }
}


function saveHistory(history) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error(
      "History save error:",
      error
    );
  }
}


function addHistory(role, content, extra = {}) {
  const history = getHistory();

  history.push({
    role,
    content,
    time: new Date().toISOString(),
    ...extra
  });

  saveHistory(history);
}


/* =========================================================
   LOAD HISTORY
========================================================= */

function loadHistory() {
  const history = getHistory();

  if (!chatContainer) {
    return;
  }

  history.forEach(item => {
    if (item.role === "user") {
      addMessageToUI(
        "user",
        item.content,
        false
      );
    }

    if (item.role === "assistant") {
      addMessageToUI(
        "assistant",
        item.content,
        false,
        item
      );
    }
  });
}


/* =========================================================
   SELECTED CAPABILITY
========================================================= */

function getSelectedCapability() {

  if (!modelSelector) {
    return "gemini";
  }

  const value =
    String(
      modelSelector.value || ""
    )
      .trim()
      .toLowerCase();

  const text =
    String(
      modelSelector.options?.[
        modelSelector.selectedIndex
      ]?.text || ""
    )
      .trim()
      .toLowerCase();


  /* ChatGPT */

  if (
    value === "chatgpt" ||
    value === "openai" ||
    value.includes("chatgpt") ||
    text.includes("chatgpt")
  ) {
    return "chatgpt";
  }


  /* Groq */

  if (
    value === "groq" ||
    value.includes("groq") ||
    text.includes("groq")
  ) {
    return "groq";
  }


  /* Web Search */

  if (
    value === "websearch" ||
    value === "web-search" ||
    value === "web_search" ||
    value.includes("websearch") ||
    text.includes("web search")
  ) {
    return "websearch";
  }


  /* Everything else */

  return "gemini";
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   MARKDOWN
========================================================= */

function renderMarkdown(text) {

  let source =
    String(text || "");


  /* Protect code blocks */

  const codeBlocks = [];

  source =
    source.replace(
      /```([\w+-]*)\n?([\s\S]*?)```/g,
      function (_, language, code) {

        const index =
          codeBlocks.length;

        codeBlocks.push({
          language:
            language || "code",

          code:
            code.trim()
        });

        return `___CODE_BLOCK_${index}___`;
      }
    );


  /* Escape HTML */

  source =
    escapeHTML(source);


  /* Bold */

  source =
    source.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  /* Italic */

  source =
    source.replace(
      /(^|[^\*])\*([^\*]+)\*(?!\*)/g,
      "$1<em>$2</em>"
    );


  /* Inline code */

  source =
    source.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );


  /* Headings */

  source =
    source.replace(
      /^### (.*)$/gm,
      "<h4>$1</h4>"
    );

  source =
    source.replace(
      /^## (.*)$/gm,
      "<h3>$1</h3>"
    );

  source =
    source.replace(
      /^# (.*)$/gm,
      "<h2>$1</h2>"
    );


  /* Unordered list */

  source =
    source.replace(
      /^[\-\*] (.*)$/gm,
      "<li>$1</li>"
    );


  source =
    source.replace(
      /(<li>.*<\/li>)/gs,
      "<ul>$1</ul>"
    );


  /* Line breaks */

  source =
    source.replace(
      /\n/g,
      "<br>"
    );


  /* Restore code blocks */

  codeBlocks.forEach(
    (block, index) => {

      const safeCode =
        escapeHTML(
          block.code
        );

      const codeHTML = `
        <div class="code-block">

          <div class="code-header">

            <span>
              ${escapeHTML(
                block.language
              )}
            </span>

            <button
              type="button"
              class="copy-code-btn"
              data-code="${escapeHTML(
                block.code
              )}"
            >
              Copy
            </button>

          </div>

          <pre><code>${safeCode}</code></pre>

        </div>
      `;

      source =
        source.replace(
          `___CODE_BLOCK_${index}___`,
          codeHTML
        );
    }
  );


  return source;
}


/* =========================================================
   WEB SOURCES
========================================================= */

function renderSources(sources) {

  if (
    !Array.isArray(sources) ||
    sources.length === 0
  ) {
    return "";
  }


  const unique = [];

  sources.forEach(source => {

    if (
      !source ||
      !source.url
    ) {
      return;
    }

    if (
      unique.some(
        item =>
          item.url === source.url
      )
    ) {
      return;
    }

    unique.push(source);
  });


  if (!unique.length) {
    return "";
  }


  const html =
    unique
      .slice(0, 8)
      .map(
        source => {

          const title =
            escapeHTML(
              source.title ||
              "Web Source"
            );

          const url =
            escapeHTML(
              source.url
            );

          return `
            <a
              class="web-source"
              href="${url}"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 ${title}
            </a>
          `;
        }
      )
      .join("");


  return `
    <div class="web-sources">

      <div class="web-sources-title">
        🌐 Sources
      </div>

      ${html}

    </div>
  `;
}


/* =========================================================
   ADD MESSAGE TO UI
========================================================= */

function addMessageToUI(
  role,
  text,
  save = true,
  meta = {}
) {

  if (!chatContainer) {
    return null;
  }


  const messageElement =
    document.createElement("div");


  messageElement.className =
    `message ${role}-message`;


  const avatar =
    role === "user"
      ? "👤"
      : "🤖";


  let contentHTML =
    role === "assistant"
      ? renderMarkdown(text)
      : escapeHTML(text)
          .replace(
            /\n/g,
            "<br>"
          );


  /* Web sources */

  if (
    role === "assistant" &&
    Array.isArray(meta.sources)
  ) {
    contentHTML +=
      renderSources(
        meta.sources
      );
  }


  messageElement.innerHTML = `
    <div class="message-avatar">
      ${avatar}
    </div>

    <div class="message-content">
      ${contentHTML}
    </div>
  `;


  chatContainer.appendChild(
    messageElement
  );


  scrollToBottom();


  if (save) {

    addHistory(
      role,
      text,
      {
        provider:
          meta.provider || "",

        model:
          meta.model || "",

        capability:
          meta.capability || "",

        sources:
          meta.sources || []
      }
    );
  }


  return messageElement;
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom() {

  if (!chatContainer) {
    return;
  }

  setTimeout(
    () => {

      chatContainer.scrollTop =
        chatContainer.scrollHeight;

    },
    20
  );
}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTyping() {

  if (!chatContainer) {
    return null;
  }


  removeTyping();


  const typing =
    document.createElement("div");


  typing.id =
    "infinityTyping";


  typing.className =
    "message assistant-message typing-message";


  typing.innerHTML = `
    <div class="message-avatar">
      🤖
    </div>

    <div class="message-content typing-content">

      <span></span>
      <span></span>
      <span></span>

    </div>
  `;


  chatContainer.appendChild(
    typing
  );


  scrollToBottom();


  return typing;
}


function removeTyping() {

  const typing =
    $("infinityTyping");

  if (typing) {
    typing.remove();
  }
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

  if (isSending) {
    return;
  }


  if (!messageInput) {
    return;
  }


  const userMessage =
    messageInput.value.trim();


  if (
    !userMessage &&
    !selectedImage &&
    !selectedPDF
  ) {
    return;
  }


  isSending = true;


  if (sendButton) {
    sendButton.disabled =
      true;
  }


  /* User UI */

  if (userMessage) {

    addMessageToUI(
      "user",
      userMessage,
      true
    );
  }


  messageInput.value = "";


  /* Selected capability */

  const selectedCapability =
    getSelectedCapability();


  console.log(
    "🎯 Selected capability:",
    selectedCapability
  );


  /* Loading */

  showTyping();


  try {

    const payload = {
      message:
        userMessage,

      capability:
        selectedCapability
    };


    /* =========================
       IMAGE
    ========================= */

    if (selectedImage) {

      payload.image =
        selectedImage;

      payload.imageMimeType =
        selectedImageMimeType;
    }


    /* =========================
       PDF
    ========================= */

    if (selectedPDF) {

      payload.pdf =
        selectedPDF;

      payload.pdfMimeType =
        selectedPDFMimeType;

      payload.fileName =
        selectedPDFName;
    }


    /* =========================
       API REQUEST
    ========================= */

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data?.error ||
        "AI request failed."
      );
    }


    if (!data?.success) {

      throw new Error(
        data?.error ||
        "AI service failed."
      );
    }


    console.log(
      "✅ Provider:",
      data.provider
    );

    console.log(
      "✅ Model:",
      data.model
    );

    console.log(
      "✅ Capability:",
      data.capability
    );


    removeTyping();


    /* =========================
       AI RESPONSE
    ========================= */

    addMessageToUI(
      "assistant",
      data.reply ||
        "No response received.",
      true,
      {
        provider:
          data.provider,

        model:
          data.model,

        capability:
          data.capability,

        sources:
          data.sources || []
      }
    );


    /* Clear selected files */

    clearSelectedFiles();


  } catch (error) {

    console.error(
      "❌ AI Error:",
      error
    );


    removeTyping();


    addMessageToUI(
      "assistant",
      "⚠️ AI সার্ভিসে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন."
    );


  } finally {

    isSending =
      false;

    if (sendButton) {
      sendButton.disabled =
        false;
    }

    messageInput.focus();
  }
}


/* =========================================================
   ENTER TO SEND
========================================================= */

if (messageInput) {

  messageInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }
    }
  );
}


/* =========================================================
   SEND BUTTON
========================================================= */

if (sendButton) {

  sendButton.addEventListener(
    "click",
    sendMessage
  );
}


/* =========================================================
   MODEL SELECTOR
========================================================= */

if (modelSelector) {

  modelSelector.addEventListener(
    "change",
    () => {

      const capability =
        getSelectedCapability();

      console.log(
        "🤖 Model changed:",
        capability
      );

    }
  );
}


/* =========================================================
   WEB SEARCH BUTTON
========================================================= */

if (webSearchButton) {

  webSearchButton.addEventListener(
    "click",
    () => {

      if (modelSelector) {

        const option =
          Array.from(
            modelSelector.options
          ).find(
            item =>
              item.value ===
              "websearch"
          );


        if (option) {

          modelSelector.value =
            "websearch";

        }
      }


      console.log(
        "🌐 Web Search enabled"
      );


      /* Close plus menu */

      if (plusMenu) {
        plusMenu.classList.remove(
          "active"
        );
      }

    }
  );
}


/* =========================================================
   PLUS MENU
========================================================= */

if (plusButton && plusMenu) {

  plusButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      plusMenu.classList.toggle(
        "active"
      );
    }
  );


  document.addEventListener(
    "click",
    event => {

      if (
        !plusMenu.contains(event.target) &&
        event.target !== plusButton
      ) {

        plusMenu.classList.remove(
          "active"
        );
      }
    }
  );
}


/* =========================================================
   FILE TO BASE64
========================================================= */

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        const result =
          String(
            reader.result || ""
          );


        /* Remove data URL prefix */

        const base64 =
          result.includes(",")
            ? result.split(",")[1]
            : result;


        resolve(base64);
      };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );
    }
  );
}


/* =========================================================
   GALLERY
========================================================= */

function openGallery() {

  if (galleryInput) {

    galleryInput.click();

    return;
  }


  if (imageInput) {

    imageInput.click();
  }
}


/* =========================================================
   IMAGE INPUT
========================================================= */

const actualImageInput =
  imageInput ||
  galleryInput;


if (actualImageInput) {

  actualImageInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Please select an image."
        );

        return;
      }


      try {

        selectedImage =
          await fileToBase64(
            file
          );

        selectedImageMimeType =
          file.type;


        console.log(
          "🖼️ Image selected:",
          file.name
        );


        showFilePreview(
          file,
          "image"
        );


      } catch (error) {

        console.error(
          "Image error:",
          error
        );

        alert(
          "Image load failed."
        );
      }
    }
  );
}


/* =========================================================
   CAMERA
========================================================= */

if (cameraInput) {

  cameraInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      try {

        selectedImage =
          await fileToBase64(
            file
          );

        selectedImageMimeType =
          file.type;


        console.log(
          "📷 Camera image selected."
        );


        showFilePreview(
          file,
          "image"
        );


      } catch (error) {

        console.error(
          "Camera image error:",
          error
        );
      }
    }
  );
}


/* =========================================================
   PDF INPUT
========================================================= */

if (pdfInput) {

  pdfInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        file.type !==
        "application/pdf"
      ) {

        alert(
          "Please select a PDF file."
        );

        return;
      }


      try {

        selectedPDF =
          await fileToBase64(
            file
          );

        selectedPDFMimeType =
          file.type;

        selectedPDFName =
          file.name;


        console.log(
          "📄 PDF selected:",
          file.name
        );


        showFilePreview(
          file,
          "pdf"
        );


      } catch (error) {

        console.error(
          "PDF error:",
          error
        );

        alert(
          "PDF load failed."
        );
      }
    }
  );
}


/* =========================================================
   FILE PREVIEW
========================================================= */

function showFilePreview(
  file,
  type
) {

  let preview =
    $("filePreview");


  if (!preview) {

    preview =
      document.createElement(
        "div"
      );

    preview.id =
      "filePreview";


    if (messageInput) {

      messageInput
        .parentElement
        ?.appendChild(
          preview
        );
    }
  }


  if (!preview) {
    return;
  }


  preview.innerHTML = "";


  preview.className =
    "file-preview";


  const icon =
    type === "pdf"
      ? "📄"
      : "🖼️";


  preview.innerHTML = `
    <div class="selected-file">

      <span class="selected-file-icon">
        ${icon}
      </span>

      <span class="selected-file-name">
        ${escapeHTML(
          file.name
        )}
      </span>

      <button
        type="button"
        id="removeSelectedFile"
      >
        ✕
      </button>

    </div>
  `;


  const removeButton =
    $("removeSelectedFile");


  if (removeButton) {

    removeButton.addEventListener(
      "click",
      clearSelectedFiles
    );
  }
}


/* =========================================================
   CLEAR FILES
========================================================= */

function clearSelectedFiles() {

  selectedFile =
    null;

  selectedFileType =
    null;

  selectedImage =
    null;

  selectedImageMimeType =
    null;

  selectedPDF =
    null;

  selectedPDFMimeType =
    null;

  selectedPDFName =
    null;


  if (imageInput) {
    imageInput.value = "";
  }

  if (galleryInput) {
    galleryInput.value = "";
  }

  if (cameraInput) {
    cameraInput.value = "";
  }

  if (pdfInput) {
    pdfInput.value = "";
  }


  const preview =
    $("filePreview");


  if (preview) {
    preview.innerHTML = "";
    preview.className =
      "file-preview";
  }
}


/* =========================================================
   GALLERY BUTTON FALLBACK
========================================================= */

const galleryButton =
  $("galleryButton") ||
  $("openGallery");


if (galleryButton) {

  galleryButton.addEventListener(
    "click",
    openGallery
  );
}


/* =========================================================
   PDF BUTTON FALLBACK
========================================================= */

const pdfButton =
  $("pdfButton") ||
  $("uploadPDF");


if (pdfButton && pdfInput) {

  pdfButton.addEventListener(
    "click",
    () => {

      pdfInput.click();

    }
  );
}


/* =========================================================
   CAMERA BUTTON FALLBACK
========================================================= */

const cameraButton =
  $("cameraButton") ||
  $("openCamera");


if (cameraButton && cameraInput) {

  cameraButton.addEventListener(
    "click",
    () => {

      cameraInput.click();

    }
  );
}


/* =========================================================
   COPY CODE
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        ".copy-code-btn"
      );


    if (!button) {
      return;
    }


    const code =
      button.dataset.code || "";


    try {

      await navigator.clipboard.writeText(
        code
      );


      const oldText =
        button.textContent;


      button.textContent =
        "Copied ✓";


      setTimeout(
        () => {

          button.textContent =
            oldText;

        },
        1500
      );


    } catch (error) {

      console.error(
        "Copy failed:",
        error
      );


      /* Fallback */

      const textarea =
        document.createElement(
          "textarea"
        );


      textarea.value =
        code;


      document.body.appendChild(
        textarea
      );


      textarea.select();


      try {
        document.execCommand(
          "copy"
        );

        button.textContent =
          "Copied ✓";

      } catch {
        button.textContent =
          "Copy failed";
      }


      textarea.remove();


      setTimeout(
        () => {

          button.textContent =
            "Copy";

        },
        1500
      );
    }
  }
);


/* =========================================================
   CLEAR CHAT
========================================================= */

const clearChatButton =
  $("clearChat") ||
  $("clearHistory") ||
  $("clearChatButton");


if (clearChatButton) {

  clearChatButton.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        HISTORY_KEY
      );


      if (chatContainer) {

        chatContainer.innerHTML =
          "";
      }


      console.log(
        "🗑️ Chat history cleared."
      );
    }
  );
}


/* =========================================================
   NEW CHAT
========================================================= */

const newChatButton =
  $("newChat");


if (newChatButton) {

  newChatButton.addEventListener(
    "click",
    () => {

      if (chatContainer) {

        chatContainer.innerHTML =
          "";
      }


      messageInput?.focus();
    }
  );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "🚀 Infinity AI frontend loaded."
    );


    console.log(
      "🌐 API:",
      API_URL
    );


    console.log(
      "🤖 Capability:",
      getSelectedCapability()
    );


    loadHistory();

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.sendMessage =
  sendMessage;

window.openGallery =
  openGallery;

window.clearSelectedFiles =
  clearSelectedFiles;

window.getSelectedCapability =
  getSelectedCapability;


/* =========================================================
   END
========================================================= */

console.log(
  "✅ Infinity AI app.js ready."
);
