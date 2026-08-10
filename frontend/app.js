// ===================================
//   AI Super App - Frontend Logic
//   Backend: https://ai-super-app-3fr7.onrender.com
// ===================================

const API_URL = 'https://ai-super-app-3fr7.onrender.com/api/chat';

// ---------- DOM Elements ----------
const chatContainer = document.getElementById('chatContainer');
const messageInput  = document.getElementById('messageInput');
const sendBtn       = document.getElementById('sendBtn');
const navItems      = document.querySelectorAll('.nav-item');

// ---------- State ----------
let isWaitingForResponse = false;

// ---------- Helper: Scroll to bottom ----------
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove welcome message if present
function removeWelcomeMessage() {
  const welcome = document.querySelector('.welcome-message');
  if (welcome) welcome.remove();
}

// ---------- Add a message bubble ----------
function addMessageBubble(text, type) {
  removeWelcomeMessage();

  const bubble = document.createElement('div');
  bubble.classList.add('message');

  if (type === 'user') {
    bubble.classList.add('user-message');
  } else if (type === 'ai') {
    bubble.classList.add('ai-message');
  } else if (type === 'loading') {
    bubble.classList.add('ai-message', 'ai-loading');
  } else if (type === 'error') {
    bubble.classList.add('ai-message', 'error-message');
  }

  bubble.textContent = text;
  chatContainer.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

// ---------- Replace a bubble ----------
function replaceBubble(oldBubble, text, type) {
  oldBubble.textContent = text;
  oldBubble.className = 'message';

  if (type === 'ai') {
    oldBubble.classList.add('ai-message');
  } else if (type === 'error') {
    oldBubble.classList.add('ai-message', 'error-message');
  }

  scrollToBottom();
}

// ---------- Send Message ----------
async function sendMessage() {
  const userMessage = messageInput.value.trim();

  if (!userMessage) return;

  if (isWaitingForResponse) return;

  addMessageBubble(userMessage, 'user');

  messageInput.value = '';
  messageInput.focus();

  const loadingBubble = addMessageBubble('AI is thinking...', 'loading');
  isWaitingForResponse = true;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage
      })
    });

    if (!response.ok) {
      throw new Error(`Server error (${response.status})`);
    }

    const data = await response.json();
    const aiReply = data.reply || 'উত্তর পাওয়া যায়নি।';

    replaceBubble(loadingBubble, aiReply, 'ai');

  } catch (error) {
    console.error('API Error:', error);

    replaceBubble(
      loadingBubble,
      '⚠️ AI সার্ভিসে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
      'error'
    );

  } finally {
    isWaitingForResponse = false;
  }
}

// ---------- Event Listeners ----------
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ---------- Bottom Navigation ----------
function setActiveNav(activeButton) {
  navItems.forEach(btn => btn.classList.remove('active'));
  activeButton.classList.add('active');
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;

    if (tab === 'chat') {
      setActiveNav(item);
    } else {
      alert(
        `${item.querySelector('.nav-label').textContent} ফিচার শীঘ্রই আসছে!`
      );

      const chatNav = document.querySelector(
        '.nav-item[data-tab="chat"]'
      );

      if (chatNav) {
        setActiveNav(chatNav);
      }
    }
  });
});

// ---------- Initial setup ----------
const chatTab = document.querySelector(
  '.nav-item[data-tab="chat"]'
);

if (chatTab) {
  setActiveNav(chatTab);
}

messageInput.focus();
