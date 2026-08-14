// ===================================
//   AI Super App - Frontend Logic
//   Current Provider: Gemini
//   Backend: Render
// ===================================

const API_URL = 'https://ai-super-app-3fr7.onrender.com/api/chat';

// ---------- DOM Elements ----------
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const navItems = document.querySelectorAll('.nav-item');

const aiModel = document.getElementById('aiModel');
const modelStatus = document.getElementById('modelStatus');

// ---------- State ----------
let isWaitingForResponse = false;

// Gemini is currently the only connected provider
let selectedModel = 'gemini';

// ---------- Available AI Providers ----------
// enabled: true = actually connected
// enabled: false = coming soon
const AI_PROVIDERS = {
  gemini: {
    name: 'Gemini',
    enabled: true
  },

  deepseek: {
    name: 'DeepSeek',
    enabled: false
  },

  chatgpt: {
    name: 'ChatGPT',
    enabled: false
  },

  claude: {
    name: 'Claude',
    enabled: false
  },

  kimi: {
    name: 'Kimi',
    enabled: false
  },

  perplexity: {
    name: 'Perplexity AI',
    enabled: false
  }
};

// ---------- Helper: Scroll to Bottom ----------
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ---------- Remove Welcome Message ----------
function removeWelcomeMessage() {
  const welcome = document.querySelector('.welcome-message');

  if (welcome) {
    welcome.remove();
  }
}

// ---------- Add Message Bubble ----------
function addMessageBubble(text, type) {
  removeWelcomeMessage();

  const bubble = document.createElement('div');

  bubble.classList.add('message');

  if (type === 'user') {
    bubble.classList.add('user-message');
  }

  else if (type === 'ai') {
    bubble.classList.add('ai-message');
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

  chatContainer.appendChild(bubble);

  scrollToBottom();

  return bubble;
}

// ---------- Replace Bubble ----------
function replaceBubble(oldBubble, text, type) {

  oldBubble.textContent = text;

  oldBubble.className = 'message';

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
// AI MODEL SELECTOR
// =========================================================

function updateModelStatus() {

  const provider = AI_PROVIDERS[selectedModel];

  if (!provider) {
    return;
  }

  if (provider.enabled) {

    modelStatus.textContent =
      `${provider.name} বর্তমানে সক্রিয় ✅`;

    modelStatus.style.color = '#22c55e';

  }

  else {

    modelStatus.textContent =
      `${provider.name} শীঘ্রই আসছে 🔜`;

    modelStatus.style.color = '#818cf8';

  }
}

// ---------- Model Change ----------
if (aiModel) {

  aiModel.addEventListener('change', () => {

    const newModel = aiModel.value;

    const provider = AI_PROVIDERS[newModel];

    if (!provider) {
      return;
    }

    // Provider is not connected yet
    if (!provider.enabled) {

      // Keep Gemini selected
      aiModel.value = selectedModel;

      alert(
        `${provider.name} এখনো সংযুক্ত করা হয়নি। 🔜\n\nবর্তমানে শুধু Gemini কাজ করছে।`
      );

      updateModelStatus();

      return;
    }

    // Provider is available
    selectedModel = newModel;

    updateModelStatus();

  });

}

// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

  const userMessage =
    messageInput.value.trim();

  // Empty message
  if (!userMessage) {
    return;
  }

  // Prevent double sending
  if (isWaitingForResponse) {
    return;
  }

  // Make sure selected provider exists
  const provider =
    AI_PROVIDERS[selectedModel];

  if (!provider) {

    addMessageBubble(
      '⚠️ AI provider পাওয়া যায়নি।',
      'error'
    );

    return;
  }

  // Currently only Gemini is connected
  if (!provider.enabled) {

    addMessageBubble(
      `⚠️ ${provider.name} এখনো সংযুক্ত করা হয়নি।`,
      'error'
    );

    return;
  }

  // ---------- User Message ----------
  addMessageBubble(
    userMessage,
    'user'
  );

  // Clear input
  messageInput.value = '';

  messageInput.focus();

  // ---------- Loading ----------
  const loadingBubble =
    addMessageBubble(
      'Gemini চিন্তা করছে... 🤔',
      'loading'
    );

  isWaitingForResponse = true;

  try {

    const response = await fetch(
      API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          message: userMessage
        })
      }
    );

    // HTTP error
    if (!response.ok) {

      throw new Error(
        `Server error (${response.status})`
      );

    }

    const data =
      await response.json();

    // Check backend response
    const aiReply =
      data.reply ||
      'উত্তর পাওয়া যায়নি।';

    // Replace loading message
    replaceBubble(
      loadingBubble,
      aiReply,
      'ai'
    );

  }

  catch (error) {

    console.error(
      'API Error:',
      error
    );

    replaceBubble(
      loadingBubble,
      '⚠️ AI সার্ভিসে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
      'error'
    );

  }

  finally {

    isWaitingForResponse = false;

  }
}

// =========================================================
// EVENT LISTENERS
// =========================================================

// Send button
if (sendBtn) {

  sendBtn.addEventListener(
    'click',
    sendMessage
  );

}

// Enter key
if (messageInput) {

  messageInput.addEventListener(
    'keypress',
    (e) => {

      if (
        e.key === 'Enter' &&
        !e.shiftKey
      ) {

        e.preventDefault();

        sendMessage();

      }

    }
  );

}

// =========================================================
// BOTTOM NAVIGATION
// =========================================================

function setActiveNav(activeButton) {

  navItems.forEach(
    btn => btn.classList.remove('active')
  );

  if (activeButton) {

    activeButton.classList.add('active');

  }

}

navItems.forEach(item => {

  item.addEventListener(
    'click',
    () => {

      const tab =
        item.dataset.tab;

      if (tab === 'chat') {

        setActiveNav(item);

      }

      else {

        const label =
          item.querySelector(
            '.nav-label'
          );

        const featureName =
          label
            ? label.textContent
            : tab;

        alert(
          `${featureName} ফিচার শীঘ্রই আসছে! 🚀`
        );

        const chatNav =
          document.querySelector(
            '.nav-item[data-tab="chat"]'
          );

        if (chatNav) {

          setActiveNav(chatNav);

        }

      }

    }
  );

});

// =========================================================
// INITIAL SETUP
// =========================================================

// Set Gemini as default
if (aiModel) {

  aiModel.value = 'gemini';

  selectedModel = 'gemini';

  updateModelStatus();

}

// Chat tab active
const chatTab =
  document.querySelector(
    '.nav-item[data-tab="chat"]'
  );

if (chatTab) {

  setActiveNav(chatTab);

}

// Focus input
if (messageInput) {

  messageInput.focus();

}
