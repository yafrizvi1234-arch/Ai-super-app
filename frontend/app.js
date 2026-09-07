// ==========================================
// INFINITY AI - APP.JS
// Chat + Image + PDF + Chat History
// ==========================================

const API_URL = 'https://ai-super-app-3fr7.onrender.com/api/chat';

// ==========================================
// DOM ELEMENTS
// ==========================================

const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

const navItems = document.querySelectorAll('.nav-item');

const aiModel = document.getElementById('aiModel');
const modelStatus = document.getElementById('modelStatus');

const plusBtn = document.getElementById('plusBtn');
const plusMenuOverlay = document.getElementById('plusMenuOverlay');
const closePlusBtn = document.getElementById('closePlusBtn');
const toolItems = document.querySelectorAll('.tool-item');

const galleryInput = document.getElementById('galleryInput');
const cameraInput = document.getElementById('cameraInput');


// ==========================================
// HISTORY DOM ELEMENTS
// ==========================================

const historyBtn = document.getElementById('historyBtn');
const newChatBtn = document.getElementById('newChatBtn');

const historyOverlay = document.getElementById('historyOverlay');
const historyPanel = document.getElementById('historyPanel');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

const historyNewChatBtn = document.getElementById('historyNewChatBtn');
const historySearchInput = document.getElementById('historySearchInput');

const conversationList = document.getElementById('conversationList');
const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');


// ==========================================
// STATE
// ==========================================

let isWaitingForResponse = false;

let selectedImage = null;
let selectedPDF = null;

let pdfInput = null;


// ==========================================
// CHAT HISTORY STORAGE
// ==========================================

const HISTORY_STORAGE_KEY = 'infinity_ai_chat_history_v1';
const CURRENT_CHAT_STORAGE_KEY = 'infinity_ai_current_chat_v1';

let conversations = [];
let currentConversationId = null;


// ==========================================
// AI CAPABILITIES
// ==========================================

const AI_CAPABILITIES = {
    gemini: {
        name: 'Infinity AI Core',
        status: 'Infinity AI Core Online ✓'
    },

    deep: {
        name: 'Deep Reasoning',
        status: 'Deep Reasoning Online ✓'
    },

    advanced: {
        name: 'Advanced Assistant',
        status: 'Advanced Assistant Online ✓'
    },

    creative: {
        name: 'Creative Intelligence',
        status: 'Creative Intelligence Online ✓'
    },

    long: {
        name: 'Long Context AI',
        status: 'Long Context AI Online ✓'
    },

    web: {
        name: 'Web Intelligence',
        status: 'Web Intelligence Online ✓'
    }
};


// ==========================================
// UTILITY
// ==========================================

function scrollToBottom() {
    if (!chatContainer) return;

    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function removeWelcomeMessage() {
    const welcome = chatContainer?.querySelector('.welcome-message');

    if (welcome) {
        welcome.remove();
    }
}


function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ==========================================
// MESSAGE BUBBLE
// ==========================================

function addMessageBubble(text, type) {
    removeWelcomeMessage();

    const bubble = document.createElement('div');

    bubble.classList.add('message');

    if (type === 'user') {
        bubble.classList.add('user-message');
    }

    if (type === 'ai') {
        bubble.classList.add('ai-message');
    }

    if (type === 'loading') {
        bubble.classList.add('ai-message');
        bubble.classList.add('ai-loading');
    }

    if (type === 'error') {
        bubble.classList.add('error-message');
    }

    bubble.textContent = text;

    chatContainer.appendChild(bubble);

    scrollToBottom();

    return bubble;
}


function replaceBubble(oldBubble, text, type) {
    if (!oldBubble) return null;

    const newBubble = document.createElement('div');

    newBubble.classList.add('message');

    if (type === 'user') {
        newBubble.classList.add('user-message');
    }

    if (type === 'ai') {
        newBubble.classList.add('ai-message');
    }

    if (type === 'error') {
        newBubble.classList.add('error-message');
    }

    newBubble.textContent = text;

    oldBubble.replaceWith(newBubble);

    scrollToBottom();

    return newBubble;
}


// ==========================================
// MODEL STATUS
// ==========================================

function updateModelStatus() {
    if (!modelStatus) return;

    modelStatus.textContent = 'Infinity AI Core Online ✓';
}


if (aiModel) {
    aiModel.addEventListener('change', updateModelStatus);
}


// ==========================================
// PDF INPUT
// ==========================================

function createPDFInput() {

    pdfInput = document.getElementById('pdfInput');

    if (!pdfInput) {

        pdfInput = document.createElement('input');

        pdfInput.type = 'file';
        pdfInput.id = 'pdfInput';
        pdfInput.accept = 'application/pdf,.pdf';
        pdfInput.hidden = true;

        document.body.appendChild(pdfInput);
    }

    pdfInput.removeEventListener('change', handlePDFChange);

    pdfInput.addEventListener('change', handlePDFChange);
}


// ==========================================
// FILE -> DATA URL
// ==========================================

function readFileAsDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}


// ==========================================
// PDF PREVIEW
// ==========================================

function removeExistingPDFPreview() {

    const oldPreview = document.querySelector('.selected-pdf-preview');

    if (oldPreview) {
        oldPreview.remove();
    }
}


function removeSelectedPDF() {

    selectedPDF = null;

    removeExistingPDFPreview();

    if (pdfInput) {
        pdfInput.value = '';
    }

    messageInput?.focus();
}


function createPDFPreview(file) {

    removeExistingPDFPreview();

    const preview = document.createElement('div');

    preview.className = 'selected-pdf-preview';

    preview.innerHTML = `
        <div class="pdf-preview-icon">📄</div>

        <div class="pdf-preview-info">
            <strong>${escapeHtml(file.name)}</strong>
            <small>PDF selected</small>
        </div>

        <button
            type="button"
            class="remove-pdf-btn"
            aria-label="Remove PDF"
        >×</button>
    `;

    const inputArea = document.querySelector('.input-area');

    if (inputArea) {
        inputArea.parentNode.insertBefore(preview, inputArea);
    }

    const removeBtn = preview.querySelector('.remove-pdf-btn');

    if (removeBtn) {
        removeBtn.addEventListener('click', removeSelectedPDF);
    }
}


async function handlePDFChange(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {

        alert('Please select a PDF file.');

        event.target.value = '';

        return;
    }

    try {

        const dataUrl = await readFileAsDataURL(file);

        selectedPDF = {
            file,
            dataUrl,
            name: file.name,
            mimeType: file.type || 'application/pdf'
        };

        createPDFPreview(file);

        messageInput?.focus();

    } catch (error) {

        console.error('PDF read error:', error);

        alert('Could not read the PDF file.');
    }
}


// ==========================================
// IMAGE PREVIEW
// ==========================================

function createImagePreview(file) {

    removeExistingImagePreview();

    const preview = document.createElement('div');

    preview.className = 'selected-image-preview';

    const imageUrl = URL.createObjectURL(file);

    preview.innerHTML = `
        <img src="${imageUrl}" alt="Selected image">

        <div class="image-preview-info">
            <strong>${escapeHtml(file.name)}</strong>
            <small>Image selected</small>
        </div>

        <button
            type="button"
            class="remove-image-btn"
            aria-label="Remove image"
        >×</button>
    `;

    const inputArea = document.querySelector('.input-area');

    if (inputArea) {
        inputArea.parentNode.insertBefore(preview, inputArea);
    }

    const removeBtn = preview.querySelector('.remove-image-btn');

    if (removeBtn) {
        removeBtn.addEventListener('click', removeSelectedImage);
    }
}


function removeExistingImagePreview() {

    const oldPreview = document.querySelector('.selected-image-preview');

    if (oldPreview) {
        oldPreview.remove();
    }
}


function removeSelectedImage() {

    selectedImage = null;

    removeExistingImagePreview();

    if (galleryInput) {
        galleryInput.value = '';
    }

    if (cameraInput) {
        cameraInput.value = '';
    }

    messageInput?.focus();
}


// ==========================================
// CHAT HISTORY FUNCTIONS
// ==========================================

function generateConversationId() {

    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString() + '-' + Math.random().toString(36).slice(2);
}


function saveHistory() {

    try {

        localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(conversations)
        );

        if (currentConversationId) {

            localStorage.setItem(
                CURRENT_CHAT_STORAGE_KEY,
                currentConversationId
            );
        }

    } catch (error) {

        console.error('Could not save chat history:', error);

        // If browser storage becomes full, do not crash the app.
    }
}


function loadHistory() {

    try {

        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);

        if (stored) {

            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed)) {
                conversations = parsed;
            } else {
                conversations = [];
            }

        } else {

            conversations = [];
        }


        const currentId = localStorage.getItem(
            CURRENT_CHAT_STORAGE_KEY
        );

        if (currentId) {
            currentConversationId = currentId;
        }

    } catch (error) {

        console.error('Could not load chat history:', error);

        conversations = [];
        currentConversationId = null;
    }
}


function getCurrentConversation() {

    if (!currentConversationId) {
        return null;
    }

    return conversations.find(
        conversation => conversation.id === currentConversationId
    ) || null;
}


function createConversation() {

    const now = Date.now();

    const conversation = {

        id: generateConversationId(),

        title: 'New Chat',

        createdAt: now,

        updatedAt: now,

        messages: []
    };

    conversations.push(conversation);

    currentConversationId = conversation.id;

    saveHistory();

    renderConversationList();

    return conversation;
}


function ensureCurrentConversation() {

    let conversation = getCurrentConversation();

    if (!conversation) {
        conversation = createConversation();
    }

    return conversation;
}


function makeConversationTitle(text) {

    if (!text) {
        return 'New Chat';
    }

    const cleanText = String(text)
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleanText) {
        return 'New Chat';
    }

    if (cleanText.length <= 42) {
        return cleanText;
    }

    return cleanText.substring(0, 42) + '…';
}


function saveChatMessage(role, text) {

    const conversation = ensureCurrentConversation();

    if (!conversation.messages) {
        conversation.messages = [];
    }

    conversation.messages.push({

        role: role,

        text: String(text || ''),

        createdAt: Date.now()
    });


    // First user message becomes chat title.
    if (
        role === 'user' &&
        (
            !conversation.title ||
            conversation.title === 'New Chat'
        )
    ) {

        conversation.title = makeConversationTitle(text);
    }


    conversation.updatedAt = Date.now();

    saveHistory();

    renderConversationList();
}


function clearChatView() {

    if (!chatContainer) return;

    chatContainer.innerHTML = '';
}


function showWelcomeMessage() {

    if (!chatContainer) return;

    chatContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">✦</div>
            <h1>Welcome to Infinity AI</h1>
            <p>Your intelligent AI assistant is ready.</p>
        </div>
    `;
}


function renderConversationMessages(conversation) {

    clearChatView();

    if (
        !conversation ||
        !Array.isArray(conversation.messages) ||
        conversation.messages.length === 0
    ) {

        showWelcomeMessage();

        return;
    }


    conversation.messages.forEach(message => {

        let type = 'ai';

        if (message.role === 'user') {
            type = 'user';
        }

        if (message.role === 'error') {
            type = 'error';
        }

        addMessageBubble(
            message.text || '',
            type
        );
    });

    scrollToBottom();
}


function loadConversation(conversationId) {

    const conversation = conversations.find(
        item => item.id === conversationId
    );

    if (!conversation) {
        return;
    }

    currentConversationId = conversation.id;

    saveHistory();

    renderConversationMessages(conversation);

    closeHistory();

    messageInput?.focus();
}


function deleteConversation(conversationId) {

    const index = conversations.findIndex(
        conversation => conversation.id === conversationId
    );

    if (index === -1) {
        return;
    }

    conversations.splice(index, 1);


    if (currentConversationId === conversationId) {

        if (conversations.length > 0) {

            conversations.sort(
                (a, b) => b.updatedAt - a.updatedAt
            );

            currentConversationId = conversations[0].id;

            renderConversationMessages(
                conversations[0]
            );

        } else {

            currentConversationId = null;

            localStorage.removeItem(
                CURRENT_CHAT_STORAGE_KEY
            );

            showWelcomeMessage();
        }
    }


    saveHistory();

    renderConversationList();
}


function startNewChat() {

    // Remove current attachment selections.
    removeSelectedImage();
    removeSelectedPDF();

    currentConversationId = null;

    localStorage.removeItem(
        CURRENT_CHAT_STORAGE_KEY
    );

    clearChatView();

    showWelcomeMessage();

    closeHistory();

    messageInput.value = '';

    messageInput.focus();

    renderConversationList();
}


// ==========================================
// HISTORY LIST
// ==========================================

function renderConversationList(filter = '') {

    if (!conversationList) {
        return;
    }


    const oldItems = conversationList.querySelectorAll(
        '.conversation-item'
    );

    oldItems.forEach(item => item.remove());


    const emptyHistory = document.getElementById(
        'emptyHistory'
    );


    let sorted = [...conversations].sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );


    const search = String(filter || '')
        .trim()
        .toLowerCase();


    if (search) {

        sorted = sorted.filter(conversation => {

            const title = String(
                conversation.title || ''
            ).toLowerCase();

            const messages = Array.isArray(
                conversation.messages
            )
                ? conversation.messages
                    .map(message => message.text || '')
                    .join(' ')
                    .toLowerCase()
                : '';

            return (
                title.includes(search) ||
                messages.includes(search)
            );
        });
    }


    if (sorted.length === 0) {

        if (emptyHistory) {

            emptyHistory.style.display = 'flex';

            if (search) {

                emptyHistory.innerHTML = `
                    <div>🔍</div>
                    <strong>No matching chats</strong>
                    <small>Try another search.</small>
                `;
            } else {

                emptyHistory.innerHTML = `
                    <div>💬</div>
                    <strong>No conversations yet</strong>
                    <small>Your chats will appear here automatically.</small>
                `;
            }
        }

        return;
    }


    if (emptyHistory) {
        emptyHistory.style.display = 'none';
    }


    sorted.forEach(conversation => {

        const item = document.createElement('div');

        item.className = 'conversation-item';

        if (
            conversation.id === currentConversationId
        ) {
            item.classList.add('active');
        }


        const title = escapeHtml(
            conversation.title || 'New Chat'
        );


        const messageCount = Array.isArray(
            conversation.messages
        )
            ? conversation.messages.length
            : 0;


        const timeText = formatHistoryTime(
            conversation.updatedAt
        );


        item.innerHTML = `
            <button
                type="button"
                class="conversation-main"
                data-conversation-id="${escapeHtml(conversation.id)}"
            >
                <span class="conversation-icon">💬</span>

                <span class="conversation-details">
                    <strong>${title}</strong>
                    <small>${messageCount} message${messageCount === 1 ? '' : 's'} • ${timeText}</small>
                </span>
            </button>

            <button
                type="button"
                class="conversation-delete"
                data-delete-id="${escapeHtml(conversation.id)}"
                aria-label="Delete conversation"
                title="Delete chat"
            >
                🗑️
            </button>
        `;


        conversationList.appendChild(item);
    });
}


function formatHistoryTime(timestamp) {

    if (!timestamp) {
        return '';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return '';
    }


    const now = new Date();

    const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();


    if (sameDay) {

        return date.toLocaleTimeString(
            [],
            {
                hour: 'numeric',
                minute: '2-digit'
            }
        );
    }


    const yesterday = new Date(now);

    yesterday.setDate(
        yesterday.getDate() - 1
    );


    const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();


    if (isYesterday) {
        return 'Yesterday';
    }


    return date.toLocaleDateString(
        [],
        {
            day: 'numeric',
            month: 'short'
        }
    );
}


// ==========================================
// HISTORY OPEN / CLOSE
// ==========================================

function openHistory() {

    if (!historyOverlay) {
        return;
    }

    historyOverlay.classList.add('show');

    historyOverlay.setAttribute(
        'aria-hidden',
        'false'
    );

    renderConversationList(
        historySearchInput?.value || ''
    );

    setTimeout(() => {
        historySearchInput?.focus();
    }, 100);
}


function closeHistory() {

    if (!historyOverlay) {
        return;
    }

    historyOverlay.classList.remove('show');

    historyOverlay.setAttribute(
        'aria-hidden',
        'true'
    );
}


// ==========================================
// HISTORY EVENT LISTENERS
// ==========================================

if (historyBtn) {

    historyBtn.addEventListener(
        'click',
        openHistory
    );
}


if (newChatBtn) {

    newChatBtn.addEventListener(
        'click',
        startNewChat
    );
}


if (closeHistoryBtn) {

    closeHistoryBtn.addEventListener(
        'click',
        closeHistory
    );
}


if (historyNewChatBtn) {

    historyNewChatBtn.addEventListener(
        'click',
        startNewChat
    );
}


if (historySearchInput) {

    historySearchInput.addEventListener(
        'input',
        () => {

            renderConversationList(
                historySearchInput.value
            );
        }
    );
}


if (conversationList) {

    conversationList.addEventListener(
        'click',
        event => {

            const deleteButton =
                event.target.closest(
                    '[data-delete-id]'
                );


            if (deleteButton) {

                event.stopPropagation();

                const id =
                    deleteButton.dataset.deleteId;

                const conversation =
                    conversations.find(
                        item => item.id === id
                    );


                if (conversation) {

                    const confirmed = confirm(
                        `Delete "${conversation.title || 'this chat'}"?`
                    );

                    if (confirmed) {
                        deleteConversation(id);
                    }
                }

                return;
            }


            const conversationButton =
                event.target.closest(
                    '[data-conversation-id]'
                );


            if (conversationButton) {

                const id =
                    conversationButton.dataset.conversationId;

                loadConversation(id);
            }
        }
    );
}


if (clearAllHistoryBtn) {

    clearAllHistoryBtn.addEventListener(
        'click',
        () => {

            if (conversations.length === 0) {

                alert('There are no chats to clear.');

                return;
            }


            const confirmed = confirm(
                'Are you sure you want to delete all chat history?'
            );


            if (!confirmed) {
                return;
            }


            conversations = [];

            currentConversationId = null;

            localStorage.removeItem(
                HISTORY_STORAGE_KEY
            );

            localStorage.removeItem(
                CURRENT_CHAT_STORAGE_KEY
            );


            clearChatView();

            showWelcomeMessage();

            renderConversationList();

            closeHistory();

            messageInput?.focus();
        }
    );
}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    if (isWaitingForResponse) {
        return;
    }


    const text =
        messageInput.value.trim();


    if (
        !text &&
        !selectedImage &&
        !selectedPDF
    ) {

        return;
    }


    isWaitingForResponse = true;

    sendBtn.disabled = true;


    // ======================================
    // USER MESSAGE TEXT
    // ======================================

    let visibleUserMessage = text;


    if (selectedImage) {

        const imageText =
            `📷 Image: ${selectedImage.name}`;


        visibleUserMessage =
            visibleUserMessage
                ? `${imageText}\n${visibleUserMessage}`
                : imageText;
    }


    if (selectedPDF) {

        const pdfText =
            `📄 PDF: ${selectedPDF.name}`;


        visibleUserMessage =
            visibleUserMessage
                ? `${pdfText}\n${visibleUserMessage}`
                : pdfText;
    }


    // ======================================
    // SHOW USER MESSAGE
    // ======================================

    addMessageBubble(
        visibleUserMessage,
        'user'
    );


    // ======================================
    // SAVE USER MESSAGE TO HISTORY
    // ======================================

    saveChatMessage(
        'user',
        visibleUserMessage
    );


    messageInput.value = '';


    // ======================================
    // LOADING
    // ======================================

    const loadingBubble =
        addMessageBubble(
            'Infinity AI is thinking…',
            'loading'
        );


    try {

        let payload = {};


        // ==================================
        // IMAGE PAYLOAD
        // ==================================

        if (selectedImage) {

            payload = {

                message: text,

                image: selectedImage.dataUrl,

                imageMimeType:
                    selectedImage.mimeType
            };
        }


        // ==================================
        // PDF PAYLOAD
        // ==================================

        else if (selectedPDF) {

            payload = {

                message: text,

                pdf: selectedPDF.dataUrl,

                pdfMimeType:
                    selectedPDF.mimeType,

                fileName:
                    selectedPDF.name
            };
        }


        // ==================================
        // NORMAL TEXT
        // ==================================

        else {

            payload = {

                message: text
            };
        }


        // ==================================
        // API REQUEST
        // ==================================

        const response = await fetch(
            API_URL,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(payload)
            }
        );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );
        }


        const data =
            await response.json();


        const reply =
            data.reply ||
            data.message ||
            'Sorry, I could not generate a response.';


        // ==================================
        // SHOW AI REPLY
        // ==================================

        replaceBubble(
            loadingBubble,
            reply,
            'ai'
        );


        // ==================================
        // SAVE AI REPLY
        // ==================================

        saveChatMessage(
            'ai',
            reply
        );


    } catch (error) {

        console.error(
            'AI request error:',
            error
        );


        const errorMessage =
            '⚠️ Something went wrong. Please try again.';


        replaceBubble(
            loadingBubble,
            errorMessage,
            'error'
        );


        saveChatMessage(
            'error',
            errorMessage
        );


    } finally {

        isWaitingForResponse = false;

        sendBtn.disabled = false;


        removeSelectedImage();

        removeSelectedPDF();


        messageInput.focus();
    }
}


// ==========================================
// SEND BUTTON
// ==========================================

if (sendBtn) {

    sendBtn.addEventListener(
        'click',
        sendMessage
    );
}


// ==========================================
// ENTER TO SEND
// ==========================================

if (messageInput) {

    messageInput.addEventListener(
        'keydown',
        event => {

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


// ==========================================
// PLUS MENU
// ==========================================

function openPlusMenu() {

    if (!plusMenuOverlay) {
        return;
    }

    plusMenuOverlay.classList.add('show');
}


function closePlusMenu() {

    if (!plusMenuOverlay) {
        return;
    }

    plusMenuOverlay.classList.remove('show');
}


if (plusBtn) {

    plusBtn.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            openPlusMenu();
        }
    );
}


if (closePlusBtn) {

    closePlusBtn.addEventListener(
        'click',
        closePlusMenu
    );
}


if (plusMenuOverlay) {

    plusMenuOverlay.addEventListener(
        'click',
        event => {

            if (
                event.target ===
                plusMenuOverlay
            ) {

                closePlusMenu();
            }
        }
    );
}


// ==========================================
// COMING SOON
// ==========================================

function showComingSoon(name) {

    alert(
        `${name} is coming soon to Infinity AI 🚀`
    );
}


// ==========================================
// GALLERY
// ==========================================

function openGallery() {

    closePlusMenu();

    if (galleryInput) {
        galleryInput.click();
    }
}


// ==========================================
// CAMERA
// ==========================================

function openCamera() {

    closePlusMenu();

    if (cameraInput) {
        cameraInput.click();
    }
}


// ==========================================
// PDF
// ==========================================

function openPDFPicker() {

    closePlusMenu();

    createPDFInput();

    pdfInput.click();
}


// ==========================================
// GALLERY CHANGE
// ==========================================

if (galleryInput) {

    galleryInput.addEventListener(
        'change',
        async event => {

            const file =
                event.target.files?.[0];

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

                galleryInput.value = '';

                return;
            }


            try {

                const dataUrl =
                    await readFileAsDataURL(file);


                selectedImage = {

                    file: file,

                    dataUrl: dataUrl,

                    name: file.name,

                    mimeType:
                        file.type || 'image/jpeg'
                };


                createImagePreview(file);

                messageInput.focus();

            } catch (error) {

                console.error(
                    'Image read error:',
                    error
                );

                alert(
                    'Could not read the image.'
                );
            }
        }
    );
}


// ==========================================
// CAMERA CHANGE
// ==========================================

if (cameraInput) {

    cameraInput.addEventListener(
        'change',
        async event => {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }


            try {

                const dataUrl =
                    await readFileAsDataURL(file);


                selectedImage = {

                    file: file,

                    dataUrl: dataUrl,

                    name:
                        file.name ||
                        'Camera Image',

                    mimeType:
                        file.type ||
                        'image/jpeg'
                };


                createImagePreview(file);

                messageInput.focus();

            } catch (error) {

                console.error(
                    'Camera image error:',
                    error
                );

                alert(
                    'Could not read the camera image.'
                );
            }
        }
    );
}


// ==========================================
// PLUS MENU TOOLS
// ==========================================

toolItems.forEach(tool => {

    tool.addEventListener(
        'click',
        () => {

            const action =
                tool.dataset.action ||
                tool.getAttribute('data-tool') ||
                '';


            if (
                action === 'gallery' ||
                action === 'image'
            ) {

                openGallery();

                return;
            }


            if (
                action === 'camera'
            ) {

                openCamera();

                return;
            }


            if (
                action === 'pdf'
            ) {

                openPDFPicker();

                return;
            }


            const toolName =
                tool.querySelector(
                    'strong'
                )?.textContent ||
                'This feature';


            showComingSoon(toolName);

            closePlusMenu();
        }
    );
});


// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(
    'keydown',
    event => {

        if (event.key !== 'Escape') {
            return;
        }

        closePlusMenu();

        closeHistory();
    }
);


// ==========================================
// BOTTOM NAV
// ==========================================

navItems.forEach(item => {

    item.addEventListener(
        'click',
        () => {

            navItems.forEach(nav => {
                nav.classList.remove('active');
            });


            item.classList.add('active');


            const tab =
                item.dataset.tab ||
                item.dataset.nav ||
                '';


            if (tab === 'chat') {

                return;
            }


            if (tab === 'history') {

                openHistory();

                return;
            }


            if (tab === 'home') {

                return;
            }


            if (tab) {

                showComingSoon(
                    item.textContent.trim()
                );
            }
        }
    );
});


// ==========================================
// INITIALIZE HISTORY
// ==========================================

loadHistory();


// ==========================================
// RESTORE CURRENT CHAT
// ==========================================

const currentConversation =
    getCurrentConversation();


if (currentConversation) {

    renderConversationMessages(
        currentConversation
    );

} else {

    showWelcomeMessage();
}


// ==========================================
// INITIALIZE HISTORY LIST
// ==========================================

renderConversationList();


// ==========================================
// INITIALIZE PDF
// ==========================================

createPDFInput();


// ==========================================
// INITIALIZE MODEL
// ==========================================

if (aiModel) {
    aiModel.value = 'gemini';
}

updateModelStatus();


// ==========================================
// INITIALIZE NAV
// ==========================================

const chatTab =
    document.querySelector(
        '.nav-item[data-tab="chat"], .nav-item[data-nav="chat"]'
    );


if (chatTab) {
    chatTab.classList.add('active');
}


// ==========================================
// FOCUS INPUT
// ==========================================

if (messageInput) {
    messageInput.focus();
}


// ==========================================
// DEBUG
// ==========================================

console.log('================================');
console.log('🚀 Infinity AI initialized');
console.log('🧠 AI API:', API_URL);
console.log('💬 Chat History:', conversations.length);
console.log('📄 PDF system: Ready');
console.log('🖼️ Image system: Ready');
console.log('➕ Plus Menu: Ready');
console.log('================================');
