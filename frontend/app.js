// ===================================
// INFINITY AI — Frontend Logic
// Main Brain: Infinity AI
// Backend: Gemini + Groq Fallback
// Vision: Gemini
// PDF: Frontend Ready
// ===================================

const API_URL =
  'https://ai-super-app-3fr7.onrender.com/api/chat';


// =========================================================
// DOM
// =========================================================

const chatContainer =
  document.getElementById('chatContainer');

const messageInput =
  document.getElementById('messageInput');

const sendBtn =
  document.getElementById('sendBtn');

const navItems =
  document.querySelectorAll('.nav-item');

const aiModel =
  document.getElementById('aiModel');

const modelStatus =
  document.getElementById('modelStatus');

const plusBtn =
  document.getElementById('plusBtn');

const plusMenuOverlay =
  document.getElementById('plusMenuOverlay');

const closePlusBtn =
  document.getElementById('closePlusBtn');

const toolItems =
  document.querySelectorAll('.tool-item');

const galleryInput =
  document.getElementById('galleryInput');

const cameraInput =
  document.getElementById('cameraInput');

// =========================================================
// STATE
// =========================================================

let isWaitingForResponse = false;

let selectedImage = null;

let selectedPDF = null;


// =========================================================
// AI CAPABILITIES
// =========================================================

const AI_CAPABILITIES = {

  gemini: {
    name: 'Infinity AI Core'
  },

  deepseek: {
    name: 'Deep Reasoning'
  },

  chatgpt: {
    name: 'Advanced Assistant'
  },

  claude: {
    name: 'Creative Intelligence'
  },

  kimi: {
    name: 'Long Context AI'
  },

  perplexity: {
    name: 'Web Intelligence'
  }

};


// =========================================================
// SCROLL
// =========================================================

function scrollToBottom() {

  if (!chatContainer) {
    return;
  }

  chatContainer.scrollTop =
    chatContainer.scrollHeight;

}


// =========================================================
// REMOVE WELCOME
// =========================================================

function removeWelcomeMessage() {

  const welcome =
    document.querySelector(
      '.welcome-message'
    );

  if (welcome) {
    welcome.remove();
  }

}


// =========================================================
// ADD MESSAGE
// =========================================================

function addMessageBubble(
  text,
  type
) {

  removeWelcomeMessage();

  const bubble =
    document.createElement('div');

  bubble.classList.add(
    'message'
  );


  if (type === 'user') {

    bubble.classList.add(
      'user-message'
    );

  }

  else if (type === 'ai') {

    bubble.classList.add(
      'ai-message'
    );

  }

  else if (type === 'loading') {

    bubble.classList.add(
      'ai-message',
      'ai-loading'
    );

  }

  else if (type === 'error') {

    bubble.classList.add(
      'ai-message',
      'error-message'
    );

  }


  bubble.textContent =
    text;


  if (chatContainer) {

    chatContainer.appendChild(
      bubble
    );

  }


  scrollToBottom();


  return bubble;

}


// =========================================================
// REPLACE MESSAGE
// =========================================================

function replaceBubble(
  oldBubble,
  text,
  type
) {

  if (!oldBubble) {
    return;
  }


  oldBubble.textContent =
    text;


  oldBubble.className =
    'message';


  if (type === 'ai') {

    oldBubble.classList.add(
      'ai-message'
    );

  }

  else if (type === 'error') {

    oldBubble.classList.add(
      'ai-message',
      'error-message'
    );

  }


  scrollToBottom();

}


// =========================================================
// MODEL STATUS
// =========================================================

function updateModelStatus() {

  if (!modelStatus) {
    return;
  }


  modelStatus.textContent =
    'Infinity AI Core Online ✓';


  modelStatus.style.color =
    '#22c55e';

}


// =========================================================
// AI CAPABILITY SELECTOR
// =========================================================

if (aiModel) {

  aiModel.addEventListener(
    'change',
    () => {

      const selected =
        aiModel.value;


      const capability =
        AI_CAPABILITIES[selected];


      if (!capability) {
        return;
      }


      updateModelStatus();

    }
  );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(text) {

  const div =
    document.createElement(
      'div'
    );


  div.textContent =
    text || '';


  return div.innerHTML;

}


// =========================================================
// READ FILE AS DATA URL
// =========================================================

function readFileAsDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              'Could not read file.'
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =========================================================
// CREATE PDF INPUT DYNAMICALLY
// No HTML change required
// =========================================================

let pdfInput = null;


function createPDFInput() {

  pdfInput =
    document.getElementById('pdfInput');

  if (!pdfInput) {

    pdfInput =
      document.createElement('input');

    pdfInput.type = 'file';
    pdfInput.id = 'pdfInput';
    pdfInput.accept = 'application/pdf,.pdf';
    pdfInput.hidden = true;

    document.body.appendChild(pdfInput);
  }

  // Prevent duplicate listener
  pdfInput.removeEventListener(
    'change',
    handlePDFChange
  );

  pdfInput.addEventListener(
    'change',
    handlePDFChange
  );
}


// =========================================================
// REMOVE PDF PREVIEW
// =========================================================

function removeExistingPDFPreview() {

  const existing =
    document.getElementById(
      'selectedPDFPreview'
    );


  if (existing) {

    existing.remove();

  }

}


// =========================================================
// REMOVE SELECTED PDF
// =========================================================

function removeSelectedPDF() {

  selectedPDF =
    null;


  removeExistingPDFPreview();


  if (pdfInput) {

    pdfInput.value =
      '';

  }


  if (messageInput) {

    messageInput.focus();

  }

}


// =========================================================
// CREATE PDF PREVIEW
// =========================================================

function createPDFPreview(file) {

  removeExistingPDFPreview();

  removeExistingImagePreview();

  selectedImage =
    null;


  if (!file) {
    return;
  }


  selectedPDF = {

    file: file,

    dataURL: null

  };


  const reader =
    new FileReader();


  reader.onload =
    function(event) {

      if (!selectedPDF) {
        return;
      }


      selectedPDF.dataURL =
        event.target.result;


      const preview =
        document.createElement(
          'div'
        );


      preview.id =
        'selectedPDFPreview';


      preview.className =
        'selected-image-preview';


      const sizeKB =
        Math.max(
          1,
          Math.round(
            file.size / 1024
          )
        );


      preview.innerHTML = `

        <div class="selected-image-inner">

          <div
            class="selected-image-thumb"
            style="
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:32px;
            "
          >
            📄
          </div>


          <div class="selected-image-info">

            <strong>
              📄 PDF Attached
            </strong>

            <small>
              ${escapeHtml(file.name)}
            </small>

            <span>
              ${sizeKB} KB • Ready for Infinity AI
            </span>

          </div>


          <div class="selected-image-actions">

            <button
              id="changeSelectedPDF"
              type="button"
              aria-label="Change PDF"
              title="Change PDF"
            >
              ↻
            </button>


            <button
              id="removeSelectedPDF"
              type="button"
              aria-label="Remove PDF"
              title="Remove PDF"
            >
              ×
            </button>

          </div>

        </div>

      `;


      const inputArea =
        document.querySelector(
          '.input-area'
        );


      if (inputArea) {

        inputArea.parentNode.insertBefore(
          preview,
          inputArea
        );

      }


      const removeBtn =
        document.getElementById(
          'removeSelectedPDF'
        );


      if (removeBtn) {

        removeBtn.addEventListener(
          'click',
          removeSelectedPDF
        );

      }


      const changeBtn =
        document.getElementById(
          'changeSelectedPDF'
        );


      if (changeBtn) {

        changeBtn.addEventListener(
          'click',
          () => {

            if (pdfInput) {

              pdfInput.click();

            }

          }
        );

      }


      scrollToBottom();


      if (messageInput) {

        messageInput.focus();

      }

    };


  reader.onerror =
    function() {

      alert(
        '❌ PDF preview failed.'
      );

    };


  reader.readAsDataURL(
    file
  );

}


// =========================================================
// HANDLE PDF CHANGE
// =========================================================

function handlePDFChange() {

  if (!pdfInput) {
    return;
  }


  const file =
    pdfInput.files?.[0];


  if (!file) {
    return;
  }


  const isPDF =
    file.type ===
      'application/pdf' ||
    file.name
      .toLowerCase()
      .endsWith('.pdf');


  if (!isPDF) {

    alert(
      'Please select a PDF file.'
    );


    pdfInput.value =
      '';


    return;

  }


  createPDFPreview(
    file
  );


  closePlusMenu();


  if (messageInput) {

    messageInput.focus();

  }

}


// =========================================================
// CREATE FUTURISTIC IMAGE PREVIEW
// =========================================================

function createImagePreview(
  file,
  source = 'gallery'
) {

  removeExistingImagePreview();

  removeSelectedPDF();


  if (!file) {
    return;
  }


  selectedImage = {

    file: file,

    dataURL: null,

    source: source

  };


  const reader =
    new FileReader();


  reader.onload =
    function(event) {

      if (!selectedImage) {
        return;
      }


      selectedImage.dataURL =
        event.target.result;


      const preview =
        document.createElement(
          'div'
        );


      preview.id =
        'selectedImagePreview';


      preview.className =
        'selected-image-preview';


      const sizeKB =
        Math.max(
          1,
          Math.round(
            file.size / 1024
          )
        );


      preview.innerHTML = `

        <div class="selected-image-inner">

          <div class="selected-image-thumb">

            <img
              src="${event.target.result}"
              alt="Selected image"
            >

          </div>


          <div class="selected-image-info">

            <strong>
              🖼️ Image Attached
            </strong>

            <small>
              ${escapeHtml(file.name)}
            </small>

            <span>
              ${sizeKB} KB • Ready for Infinity AI
            </span>

          </div>


          <div class="selected-image-actions">

            <button
              id="changeSelectedImage"
              type="button"
              aria-label="Change image"
              title="Change image"
            >
              ↻
            </button>


            <button
              id="removeSelectedImage"
              type="button"
              aria-label="Remove image"
              title="Remove image"
            >
              ×
            </button>

          </div>

        </div>

      `;


      const inputArea =
        document.querySelector(
          '.input-area'
        );


      if (inputArea) {

        inputArea.parentNode.insertBefore(
          preview,
          inputArea
        );

      }


      const removeBtn =
        document.getElementById(
          'removeSelectedImage'
        );


      if (removeBtn) {

        removeBtn.addEventListener(
          'click',
          removeSelectedImage
        );

      }


      const changeBtn =
        document.getElementById(
          'changeSelectedImage'
        );


      if (changeBtn) {

        changeBtn.addEventListener(
          'click',
          () => {

            if (
              selectedImage &&
              selectedImage.source ===
              'camera'
            ) {

              if (cameraInput) {

                cameraInput.click();

              }

            }

            else {

              if (galleryInput) {

                galleryInput.click();

              }

            }

          }
        );

      }


      scrollToBottom();


      if (messageInput) {

        messageInput.focus();

      }

    };


  reader.onerror =
    function() {

      console.error(
        '❌ Image preview failed.'
      );

    };


  reader.readAsDataURL(
    file
  );

}


// =========================================================
// REMOVE EXISTING IMAGE PREVIEW
// =========================================================

function removeExistingImagePreview() {

  const existing =
    document.getElementById(
      'selectedImagePreview'
    );


  if (existing) {

    existing.remove();

  }

}


// =========================================================
// REMOVE SELECTED IMAGE
// =========================================================

function removeSelectedImage() {

  selectedImage =
    null;


  removeExistingImagePreview();


  if (galleryInput) {

    galleryInput.value =
      '';

  }


  if (cameraInput) {

    cameraInput.value =
      '';

  }


  if (messageInput) {

    messageInput.focus();

  }

}


// =========================================================
// SEND MESSAGE
// Supports:
// Text
// Image + Text
// PDF + Text
// =========================================================

async function sendMessage() {

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


  if (isWaitingForResponse) {

    return;

  }


  const imageToSend =
    selectedImage;


  const pdfToSend =
    selectedPDF;


  // =======================================================
  // USER MESSAGE
  // =======================================================

  if (imageToSend) {

    addMessageBubble(

      `🖼️ ${imageToSend.file.name}\n\n${
        userMessage ||
        'Please analyze this image.'
      }`,

      'user'

    );

  }

  else if (pdfToSend) {

    addMessageBubble(

      `📄 ${pdfToSend.file.name}\n\n${
        userMessage ||
        'Please analyze this PDF.'
      }`,

      'user'

    );

  }

  else {

    addMessageBubble(
      userMessage,
      'user'
    );

  }


  // =======================================================
  // CLEAR TEXT INPUT
  // =======================================================

  messageInput.value =
    '';

  messageInput.focus();


  // =======================================================
  // LOADING
  // =======================================================

  const loadingText =
    imageToSend
      ? 'Infinity AI is analyzing the image... 👁️∞'
      : pdfToSend
        ? 'Infinity AI is reading the PDF... 📄∞'
        : 'Infinity AI is thinking... 🤔∞';


  const loadingBubble =
    addMessageBubble(
      loadingText,
      'loading'
    );


  isWaitingForResponse =
    true;


  try {

    let requestBody;


    // =====================================================
    // IMAGE REQUEST
    // =====================================================

    if (imageToSend) {

      let imageData =
        imageToSend.dataURL;


      if (!imageData) {

        imageData =
          await readFileAsDataURL(
            imageToSend.file
          );

      }


      requestBody = {

        message:
          userMessage ||
          'Please analyze this image.',

        image:
          imageData,

        imageMimeType:
          imageToSend.file.type ||
          'image/jpeg'

      };

    }


    // =====================================================
    // PDF REQUEST
    // =====================================================

    else if (pdfToSend) {

      let pdfData =
        pdfToSend.dataURL;


      if (!pdfData) {

        pdfData =
          await readFileAsDataURL(
            pdfToSend.file
          );

      }


      requestBody = {

        message:
          userMessage ||
          'Please analyze this PDF.',

        pdf:
          pdfData,

        pdfMimeType:
          'application/pdf',

        fileName:
          pdfToSend.file.name

      };

    }


    // =====================================================
    // TEXT REQUEST
    // =====================================================

    else {

      requestBody = {

        message:
          userMessage

      };

    }


    // =====================================================
    // API REQUEST
    // =====================================================

    const response =
      await fetch(

        API_URL,

        {

          method:
            'POST',

          headers: {

            'Content-Type':
              'application/json'

          },

          body:
            JSON.stringify(
              requestBody
            )

        }

      );


    // =====================================================
    // HTTP ERROR
    // =====================================================

    if (!response.ok) {

      let errorMessage =
        `Server error (${response.status})`;


      try {

        const errorData =
          await response.json();


        if (errorData?.error) {

          errorMessage =
            errorData.error;

        }

      }

      catch (_) {

        // Ignore JSON parse error

      }


      throw new Error(
        errorMessage
      );

    }


    // =====================================================
    // RESPONSE
    // =====================================================

    const data =
      await response.json();


    const aiReply =
      data?.reply ||
      'Infinity AI could not generate a response.';


    // =====================================================
    // SHOW AI RESPONSE
    // =====================================================

    replaceBubble(

      loadingBubble,

      aiReply,

      'ai'

    );

  }


  catch (error) {

    console.error(
      '❌ Infinity AI API Error:',
      error
    );


    replaceBubble(

      loadingBubble,

      `⚠️ Infinity AI could not process this request.\n\n${
        error.message ||
        'Please try again.'
      }`,

      'error'

    );

  }


  finally {

    isWaitingForResponse =
      false;


    removeSelectedImage();

    removeSelectedPDF();

  }

}


// =========================================================
// SEND BUTTON
// =========================================================

if (sendBtn) {

  sendBtn.addEventListener(
    'click',
    sendMessage
  );

}


// =========================================================
// ENTER KEY
// =========================================================

if (messageInput) {

  messageInput.addEventListener(
    'keydown',
    (event) => {

      if (

        event.key === 'Enter' &&

        !event.shiftKey

      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


// =========================================================
// PLUS MENU
// =========================================================

function openPlusMenu() {

  if (!plusMenuOverlay) {
    return;
  }


  plusMenuOverlay.classList.add(
    'show'
  );


  plusMenuOverlay.setAttribute(
    'aria-hidden',
    'false'
  );


  if (plusBtn) {

    plusBtn.setAttribute(
      'aria-expanded',
      'true'
    );

  }

}


function closePlusMenu() {

  if (!plusMenuOverlay) {
    return;
  }


  plusMenuOverlay.classList.remove(
    'show'
  );


  plusMenuOverlay.setAttribute(
    'aria-hidden',
    'true'
  );


  if (plusBtn) {

    plusBtn.setAttribute(
      'aria-expanded',
      'false'
    );

  }

}


// =========================================================
// PLUS BUTTON
// =========================================================

if (plusBtn) {

  plusBtn.addEventListener(
    'click',
    () => {

      if (

        plusMenuOverlay &&

        plusMenuOverlay.classList.contains(
          'show'
        )

      ) {

        closePlusMenu();

      }

      else {

        openPlusMenu();

      }

    }
  );

}


// =========================================================
// CLOSE PLUS BUTTON
// =========================================================

if (closePlusBtn) {

  closePlusBtn.addEventListener(
    'click',
    closePlusMenu
  );

}


// =========================================================
// CLICK OUTSIDE PLUS MENU
// =========================================================

if (plusMenuOverlay) {

  plusMenuOverlay.addEventListener(
    'click',
    (event) => {

      if (

        event.target ===
        plusMenuOverlay

      ) {

        closePlusMenu();

      }

    }
  );

}


// =========================================================
// ESC CLOSE
// =========================================================

document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === 'Escape'
    ) {

      closePlusMenu();

    }

  }
);


// =========================================================
// COMING SOON
// =========================================================

function showComingSoon(
  featureName
) {

  alert(

    `${featureName}\n\nComing Soon 🚀∞\n\nThis Infinity AI capability is currently under development.`

  );

}


// =========================================================
// GALLERY
// =========================================================

function handleGallery() {

  if (!galleryInput) {

    alert(
      'Gallery input is not available.'
    );

    return;

  }


  galleryInput.click();

}


// =========================================================
// CAMERA
// =========================================================

function handleCamera() {

  if (!cameraInput) {

    alert(
      'Camera input is not available.'
    );

    return;

  }


  cameraInput.click();

}


// =========================================================
// PDF
// =========================================================

function handlePDF() {

  createPDFInput();


  if (!pdfInput) {

    alert(
      'PDF input is not available.'
    );

    return;

  }


  pdfInput.click();

}


// =========================================================
// GALLERY CHANGE
// =========================================================

if (galleryInput) {

  galleryInput.addEventListener(
    'change',
    () => {

      const file =
        galleryInput.files?.[0];


      if (!file) {

        return;

      }


      if (
        !file.type.startsWith(
          'image/'
        )
      ) {

        alert(
          'Please select an image file.'
        );

        galleryInput.value =
          '';

        return;

      }


      createImagePreview(
        file,
        'gallery'
      );


      closePlusMenu();


      if (messageInput) {

        messageInput.focus();

      }

    }
  );

}


// =========================================================
// CAMERA CHANGE
// =========================================================

if (cameraInput) {

  cameraInput.addEventListener(
    'change',
    () => {

      const file =
        cameraInput.files?.[0];


      if (!file) {

        return;

      }


      if (
        !file.type.startsWith(
          'image/'
        )
      ) {

        alert(
          'Please capture/select an image.'
        );

        cameraInput.value =
          '';

        return;

      }


      createImagePreview(
        file,
        'camera'
      );


      closePlusMenu();


      if (messageInput) {

        messageInput.focus();

      }

    }
  );

}


// =========================================================
// TOOL MENU
// =========================================================

toolItems.forEach(
  (tool) => {

    tool.addEventListener(
      'click',
      () => {

        const action =
          tool.dataset.action;


        // =================================================
        // GALLERY
        // =================================================

        if (
          action === 'gallery'
        ) {

          closePlusMenu();

          handleGallery();

          return;

        }


        // =================================================
        // CAMERA
        // =================================================

        if (
          action === 'camera'
        ) {

          closePlusMenu();

          handleCamera();

          return;

        }


        // =================================================
        // IMAGE UNDERSTANDING
        // =================================================

        if (
          action ===
          'image-understanding'
        ) {

          closePlusMenu();

          handleGallery();

          return;

        }


        // =================================================
        // PDF
        // =================================================

        if (
          action === 'pdf'
        ) {

          closePlusMenu();

          handlePDF();

          return;

        }


        // =================================================
        // EVERYTHING ELSE
        // =================================================

        const title =
          tool.querySelector(
            'strong'
          );


        const featureName =
          title
            ? title.textContent
            : 'Infinity AI Feature';


        closePlusMenu();


        showComingSoon(
          featureName
        );

      }
    );

  }
);


// =========================================================
// BOTTOM NAVIGATION
// =========================================================

function setActiveNav(
  activeButton
) {

  navItems.forEach(
    button => {

      button.classList.remove(
        'active'
      );

    }
  );


  if (activeButton) {

    activeButton.classList.add(
      'active'
    );

  }

}


navItems.forEach(
  item => {

    item.addEventListener(
      'click',
      () => {

        const tab =
          item.dataset.tab;


        if (
          tab === 'chat'
        ) {

          setActiveNav(
            item
          );

          return;

        }


        const label =
          item.querySelector(
            '.nav-label'
          );


        const featureName =
          label
            ? label.textContent
            : tab;


        alert(

          `${featureName}\n\nComing Soon 🚀∞`

        );


        const chatNav =
          document.querySelector(
            '.nav-item[data-tab="chat"]'
          );


        if (chatNav) {

          setActiveNav(
            chatNav
          );

        }

      }
    );

  }
);


// =========================================================
// INITIALIZATION
// =========================================================

createPDFInput();


if (aiModel) {

  aiModel.value =
    'gemini';

}


updateModelStatus();


const chatTab =
  document.querySelector(
    '.nav-item[data-tab="chat"]'
  );


if (chatTab) {

  setActiveNav(
    chatTab
  );

}


if (messageInput) {

  messageInput.focus();

}


// =========================================================
// DEBUG
// =========================================================

console.log(
  '✨ Infinity AI initialized.'
);

console.log(
  '🧠 Infinity AI Core: Online'
);

console.log(
  '👁️ Gemini Vision: Ready'
);

console.log(
  '📷 Gallery: Ready'
);

console.log(
  '📸 Camera: Ready'
);

console.log(
  '📄 PDF Frontend: Ready'
);

console.log(
  '🔄 Image Change: Ready'
);

console.log(
  '❌ Image Remove: Ready'
);

console.log(
  '⚡ Backend: Render API'
);
