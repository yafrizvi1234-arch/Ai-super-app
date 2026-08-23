// =========================================================
// INFINITY AI — FRONTEND LOGIC
// Main Brain: Infinity AI
// Backend: Gemini + Groq Fallback
// =========================================================

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

  if (!chatContainer) return;

  chatContainer.scrollTop =
    chatContainer.scrollHeight;

}


// =========================================================
// REMOVE WELCOME
// =========================================================

function removeWelcomeMessage() {

  const welcome =
    document.querySelector('.welcome-message');

  if (welcome) {
    welcome.remove();
  }

}


// =========================================================
// ADD MESSAGE BUBBLE
// =========================================================

function addMessageBubble(
  text,
  type
) {

  removeWelcomeMessage();

  const bubble =
    document.createElement('div');

  bubble.classList.add('message');


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


  bubble.textContent = text;

  chatContainer.appendChild(
    bubble
  );

  scrollToBottom();

  return bubble;

}


// =========================================================
// ADD IMAGE MESSAGE
// =========================================================

function addImageMessage(
  file,
  source
) {

  removeWelcomeMessage();

  const bubble =
    document.createElement('div');

  bubble.classList.add(
    'message',
    'user-message',
    'image-message'
  );


  const wrapper =
    document.createElement('div');

  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '8px';


  const image =
    document.createElement('img');

  image.alt =
    source === 'camera'
      ? 'Captured image'
      : 'Selected image';

  image.style.width = '100%';
  image.style.maxWidth = '280px';
  image.style.maxHeight = '320px';
  image.style.objectFit = 'cover';
  image.style.borderRadius = '14px';
  image.style.display = 'block';


  const imageURL =
    URL.createObjectURL(file);

  image.src = imageURL;


  const info =
    document.createElement('small');

  info.textContent =
    source === 'camera'
      ? '📸 Photo captured'
      : '🖼️ Image selected';

  info.style.opacity = '0.8';


  wrapper.appendChild(image);
  wrapper.appendChild(info);

  bubble.appendChild(wrapper);

  chatContainer.appendChild(
    bubble
  );

  scrollToBottom();


  // Release memory when image is removed
  image.onload = () => {

    setTimeout(() => {

      URL.revokeObjectURL(
        imageURL
      );

    }, 1000);

  };


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

  if (!oldBubble) return;

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
// STATUS
// =========================================================

function updateModelStatus() {

  if (!modelStatus) return;

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

      // Provider names are never exposed.
      updateModelStatus();

    }
  );

}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

  if (!messageInput) {
    return;
  }


  const userMessage =
    messageInput.value.trim();


  if (!userMessage) {
    return;
  }


  if (isWaitingForResponse) {
    return;
  }


  // USER MESSAGE

  addMessageBubble(
    userMessage,
    'user'
  );


  // CLEAR INPUT

  messageInput.value = '';

  messageInput.focus();


  // INFINITY AI LOADING

  const loadingBubble =
    addMessageBubble(
      'Infinity AI is thinking... 🤔',
      'loading'
    );


  isWaitingForResponse = true;


  try {

    const response =
      await fetch(
        API_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            message:
              userMessage
          })
        }
      );


    if (!response.ok) {

      throw new Error(
        `Server error (${response.status})`
      );

    }


    const data =
      await response.json();


    const aiReply =
      data.reply ||
      'Infinity AI could not generate a response.';


    replaceBubble(
      loadingBubble,
      aiReply,
      'ai'
    );

  }


  catch (error) {

    console.error(
      'Infinity AI API Error:',
      error
    );


    replaceBubble(
      loadingBubble,
      '⚠️ Infinity AI is temporarily unavailable. Please try again.',
      'error'
    );

  }


  finally {

    isWaitingForResponse =
      false;

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


if (plusBtn) {

  plusBtn.addEventListener(
    'click',
    () => {

      if (
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


if (closePlusBtn) {

  closePlusBtn.addEventListener(
    'click',
    closePlusMenu
  );

}


// =========================================================
// CLOSE PLUS MENU OUTSIDE
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

    if (event.key === 'Escape') {

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
    `${featureName}\n\nComing Soon 🚀\n\nThis Infinity AI feature is currently under development.`
  );

}


// =========================================================
// GALLERY
// =========================================================

function handleGallery() {

  if (!galleryInput) {

    console.error(
      'Gallery input not found.'
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

    console.error(
      'Camera input not found.'
    );

    return;

  }

  cameraInput.click();

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


        // =========================
        // GALLERY
        // =========================

        if (
          action === 'gallery'
        ) {

          closePlusMenu();

          handleGallery();

          return;

        }


        // =========================
        // CAMERA
        // =========================

        if (
          action === 'camera'
        ) {

          closePlusMenu();

          handleCamera();

          return;

        }


        // =========================
        // IMAGE UNDERSTANDING
        // =========================

        if (
          action ===
          'image-understanding'
        ) {

          closePlusMenu();

          showComingSoon(
            '🧠 Image Understanding'
          );

          return;

        }


        // =========================
        // EVERYTHING ELSE
        // =========================

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
// GALLERY IMAGE RESULT
// =========================================================

if (galleryInput) {

  galleryInput.addEventListener(
    'change',
    () => {

      const file =
        galleryInput.files[0];


      if (!file) {
        return;
      }


      // Check image type

      if (
        !file.type.startsWith(
          'image/'
        )
      ) {

        alert(
          'Please select an image file.'
        );

        galleryInput.value = '';

        return;

      }


      // Show image preview

      addImageMessage(
        file,
        'gallery'
      );


      // Infinity AI status

      addMessageBubble(
        '🧠 Infinity AI image analysis is coming soon. 🚀',
        'ai'
      );


      // Allow same image to be selected again

      galleryInput.value = '';

    }
  );

}


// =========================================================
// CAMERA RESULT
// =========================================================

if (cameraInput) {

  cameraInput.addEventListener(
    'change',
    () => {

      const file =
        cameraInput.files[0];


      if (!file) {
        return;
      }


      // Check image type

      if (
        !file.type.startsWith(
          'image/'
        )
      ) {

        alert(
          'Please capture a valid image.'
        );

        cameraInput.value = '';

        return;

      }


      // Show captured image

      addImageMessage(
        file,
        'camera'
      );


      // Infinity AI status

      addMessageBubble(
        '🧠 Infinity AI image analysis is coming soon. 🚀',
        'ai'
      );


      cameraInput.value = '';

    }
  );

}


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


        if (tab === 'chat') {

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
          `${featureName}\n\nComing Soon 🚀`
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
// CONSOLE
// =========================================================

console.log(
  '✨ Infinity AI initialized.'
);

console.log(
  '🧠 Infinity AI Core: Online'
);

console.log(
  '⚡ Gemini + Groq fallback system: Active'
);

console.log(
  '🖼️ Gallery image preview: Active'
);

console.log(
  '📸 Camera image preview: Active'
);
