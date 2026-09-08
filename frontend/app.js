// ==========================================
// INFINITY AI - APP.JS
// Chat + History + Image + PDF
// Typing Animation + Markdown + Code Blocks
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
// HISTORY ELEMENTS
// ==========================================

const historyBtn = document.getElementById('historyBtn');
const newChatBtn = document.getElementById('newChatBtn');

const historyOverlay = document.getElementById('historyOverlay');
const historyPanel = document.getElementById('historyPanel');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

const historyNewChatBtn =
    document.getElementById('historyNewChatBtn');

const historySearchInput =
    document.getElementById('historySearchInput');

const conversationList =
    document.getElementById('conversationList');

const clearAllHistoryBtn =
    document.getElementById('clearAllHistoryBtn');


// ==========================================
// STATE
// ==========================================

let isWaitingForResponse = false;

let selectedImage = null;
let selectedPDF = null;

let pdfInput = null;


// ==========================================
// HISTORY STORAGE
// ==========================================

const HISTORY_STORAGE_KEY =
    'infinity_ai_chat_history_v1';

const CURRENT_CHAT_STORAGE_KEY =
    'infinity_ai_current_chat_v1';

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
// BASIC UTILITY
// ==========================================

function scrollToBottom() {

    if (!chatContainer) return;

    chatContainer.scrollTop =
        chatContainer.scrollHeight;
}


function removeWelcomeMessage() {

    const welcome =
        chatContainer?.querySelector(
            '.welcome-message'
        );

    if (welcome) {
        welcome.remove();
    }
}


function escapeHtml(text) {

    if (
        text === null ||
        text === undefined
    ) {
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
// MARKDOWN PARSER
// ==========================================

function inlineMarkdown(text) {

    let safe = escapeHtml(text);


    // Inline code
    safe = safe.replace(
        /`([^`\n]+)`/g,
        '<code class="inline-code">$1</code>'
    );


    // Bold
    safe = safe.replace(
        /\*\*(.+?)\*\*/g,
        '<strong>$1</strong>'
    );


    safe = safe.replace(
        /__(.+?)__/g,
        '<strong>$1</strong>'
    );


    // Italic
    safe = safe.replace(
        /(^|[^*])\*([^*\n]+)\*(?!\*)/g,
        '$1<em>$2</em>'
    );


    safe = safe.replace(
        /(^|[^_])_([^_\n]+)_(?!_)/g,
        '$1<em>$2</em>'
    );


    // Links
    safe = safe.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );


    return safe;
}


function markdownToHtml(markdown) {

    if (
        markdown === null ||
        markdown === undefined
    ) {
        return '';
    }


    const text = String(markdown)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');


    const lines = text.split('\n');

    let html = '';

    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];

    let inUnorderedList = false;
    let inOrderedList = false;


    function closeLists() {

        if (inUnorderedList) {

            html += '</ul>';

            inUnorderedList = false;
        }


        if (inOrderedList) {

            html += '</ol>';

            inOrderedList = false;
        }
    }


    function addCodeBlock() {

        const code =
            codeLines.join('\n');

        const safeCode =
            escapeHtml(code);


        const language =
            escapeHtml(
                codeLanguage || 'code'
            );


        html += `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-language">
                        ${language}
                    </span>

                    <button
                        type="button"
                        class="copy-code-btn"
                        data-code="${escapeHtml(code)}"
                    >
                        📋 Copy
                    </button>
                </div>

                <pre><code>${safeCode}</code></pre>
            </div>
        `;


        codeLines = [];
        codeLanguage = '';
    }


    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];


        // ==================================
        // CODE BLOCK
        // ==================================

        if (
            line.trim().startsWith('```')
        ) {

            if (!inCodeBlock) {

                closeLists();

                inCodeBlock = true;

                codeLanguage =
                    line.trim()
                        .substring(3)
                        .trim() ||
                    'code';

                codeLines = [];

            } else {

                inCodeBlock = false;

                addCodeBlock();
            }

            continue;
        }


        if (inCodeBlock) {

            codeLines.push(line);

            continue;
        }


        // ==================================
        // EMPTY LINE
        // ==================================

        if (line.trim() === '') {

            closeLists();

            html += '<div class="md-space"></div>';

            continue;
        }


        // ==================================
        // HEADINGS
        // ==================================

        if (/^###\s+/.test(line)) {

            closeLists();

            html += `
                <h4>
                    ${inlineMarkdown(
                        line.replace(/^###\s+/, '')
                    )}
                </h4>
            `;

            continue;
        }


        if (/^##\s+/.test(line)) {

            closeLists();

            html += `
                <h3>
                    ${inlineMarkdown(
                        line.replace(/^##\s+/, '')
                    )}
                </h3>
            `;

            continue;
        }


        if (/^#\s+/.test(line)) {

            closeLists();

            html += `
                <h2>
                    ${inlineMarkdown(
                        line.replace(/^#\s+/, '')
                    )}
                </h2>
            `;

            continue;
        }


        // ==================================
        // UNORDERED LIST
        // ==================================

        const unordered =
            line.match(
                /^\s*[-*+]\s+(.+)$/
            );


        if (unordered) {

            if (!inUnorderedList) {

                closeLists();

                html += '<ul>';

                inUnorderedList = true;
            }


            html += `
                <li>
                    ${inlineMarkdown(
                        unordered[1]
                    )}
                </li>
            `;

            continue;
        }


        // ==================================
        // ORDERED LIST
        // ==================================

        const ordered =
            line.match(
                /^\s*\d+\.\s+(.+)$/
            );


        if (ordered) {

            if (!inOrderedList) {

                closeLists();

                html += '<ol>';

                inOrderedList = true;
            }


            html += `
                <li>
                    ${inlineMarkdown(
                        ordered[1]
                    )}
                </li>
            `;

            continue;
        }


        // ==================================
        // BLOCKQUOTE
        // ==================================

        if (/^\s*>\s?/.test(line)) {

            closeLists();

            html += `
                <blockquote>
                    ${inlineMarkdown(
                        line.replace(
                            /^\s*>\s?/,
                            ''
                        )
                    )}
                </blockquote>
            `;

            continue;
        }


        // ==================================
        // HORIZONTAL LINE
        // ==================================

        if (
            /^\s*([-*_])\s*\1\s*\1\s*$/.test(line)
        ) {

            closeLists();

            html += '<hr>';

            continue;
        }


        // ==================================
        // NORMAL PARAGRAPH
        // ==================================

        closeLists();

        html += `
            <p>
                ${inlineMarkdown(line)}
            </p>
        `;
    }


    // Close unfinished code block
    if (inCodeBlock) {

        inCodeBlock = false;

        addCodeBlock();
    }


    closeLists();


    return html;
}


// ==========================================
// COPY CODE
// ==========================================

function copyCode(code) {

    const decoded =
        String(code || '')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');


    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard.writeText(decoded)
            .then(() => {
                showCopySuccess();
            })
            .catch(() => {
                fallbackCopy(decoded);
            });

    } else {

        fallbackCopy(decoded);
    }
}


function fallbackCopy(text) {

    const textarea =
        document.createElement('textarea');

    textarea.value = text;

    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);

    textarea.select();

    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (error) {
        console.error(
            'Copy failed:',
            error
        );
    }

    textarea.remove();
}


function showCopySuccess() {

    const button =
        event?.target?.closest?.(
            '.copy-code-btn'
        );

    if (!button) return;

    const oldText =
        button.textContent;

    button.textContent =
        '✓ Copied';

    setTimeout(() => {

        button.textContent =
            oldText || '📋 Copy';

    }, 1500);
}


// ==========================================
// CODE COPY EVENT
// ==========================================

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                '.copy-code-btn'
            );


        if (!button) return;


        const code =
            button.dataset.code || '';


        copyCode(code);
    }
);


// ==========================================
// MESSAGE BUBBLE
// ==========================================

function addMessageBubble(
    text,
    type,
    options = {}
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

        bubble.textContent =
            text || '';
    }


    else if (type === 'ai') {

        bubble.classList.add(
            'ai-message'
        );

        if (options.markdown !== false) {

            bubble.innerHTML =
                markdownToHtml(text || '');

        } else {

            bubble.textContent =
                text || '';
        }
    }


    else if (type === 'loading') {

        bubble.classList.add(
            'ai-message',
            'ai-loading'
        );

        bubble.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    }


    else if (type === 'error') {

        bubble.classList.add(
            'error-message'
        );

        bubble.textContent =
            text || '';
    }


    chatContainer.appendChild(
        bubble
    );


    scrollToBottom();


    return bubble;
}


// ==========================================
// TYPING ANIMATION
// ==========================================

async function typeAIResponse(
    bubble,
    text
) {

    if (!bubble) return;


    bubble.classList.remove(
        'ai-loading'
    );


    bubble.innerHTML = `
        <div class="typing-content"></div>
    `;


    const content =
        bubble.querySelector(
            '.typing-content'
        );


    if (!content) {

        bubble.innerHTML =
            markdownToHtml(text || '');

        return;
    }


    const fullText =
        String(text || '');


    // Faster typing for long answers.
    let speed = 14;

    if (fullText.length > 1200) {
        speed = 5;
    }

    if (fullText.length > 3000) {
        speed = 2;
    }


    let current = '';


    for (
        let i = 0;
        i < fullText.length;
        i++
    ) {

        current +=
            fullText[i];


        // Keep the visible typing safe.
        content.textContent =
            current;


        scrollToBottom();


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    speed
                )
        );
    }


    // Convert final answer to Markdown.
    bubble.innerHTML =
        markdownToHtml(fullText);


    scrollToBottom();
}


// ==========================================
// REPLACE BUBBLE
// ==========================================

function replaceBubble(
    oldBubble,
    text,
    type
) {

    if (!oldBubble) {
        return null;
    }


    const newBubble =
        document.createElement('div');


    newBubble.classList.add(
        'message'
    );


    if (type === 'user') {

        newBubble.classList.add(
            'user-message'
        );

        newBubble.textContent =
            text || '';
    }


    if (type === 'ai') {

        newBubble.classList.add(
            'ai-message'
        );

        newBubble.innerHTML =
            markdownToHtml(text || '');
    }


    if (type === 'error') {

        newBubble.classList.add(
            'error-message'
        );

        newBubble.textContent =
            text || '';
    }


    oldBubble.replaceWith(
        newBubble
    );


    scrollToBottom();


    return newBubble;
}


// ==========================================
// MODEL STATUS
// ==========================================

function updateModelStatus() {

    if (!modelStatus) return;

    modelStatus.textContent =
        'Infinity AI Core Online ✓';
}


if (aiModel) {

    aiModel.addEventListener(
        'change',
        updateModelStatus
    );
}


// ==========================================
// FILE -> DATA URL
// ==========================================

function readFileAsDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => resolve(
                    reader.result
                );


            reader.onerror =
                reject;


            reader.readAsDataURL(file);
        }
    );
}


// ==========================================
// PDF INPUT
// ==========================================

function createPDFInput() {

    pdfInput =
        document.getElementById(
            'pdfInput'
        );


    if (!pdfInput) {

        pdfInput =
            document.createElement(
                'input'
            );


        pdfInput.type =
            'file';

        pdfInput.id =
            'pdfInput';

        pdfInput.accept =
            'application/pdf,.pdf';

        pdfInput.hidden =
            true;


        document.body.appendChild(
            pdfInput
        );
    }


    pdfInput.removeEventListener(
        'change',
        handlePDFChange
    );


    pdfInput.addEventListener(
        'change',
        handlePDFChange
    );
}


// ==========================================
// PDF PREVIEW
// ==========================================

function removeExistingPDFPreview() {

    const oldPreview =
        document.querySelector(
            '.selected-pdf-preview'
        );


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


    const preview =
        document.createElement(
            'div'
        );


    preview.className =
        'selected-pdf-preview';


    preview.innerHTML = `
        <div class="pdf-preview-icon">
            📄
        </div>

        <div class="pdf-preview-info">
            <strong>
                ${escapeHtml(file.name)}
            </strong>

            <small>
                PDF selected
            </small>
        </div>

        <button
            type="button"
            class="remove-pdf-btn"
            aria-label="Remove PDF"
        >
            ×
        </button>
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
        preview.querySelector(
            '.remove-pdf-btn'
        );


    if (removeBtn) {

        removeBtn.addEventListener(
            'click',
            removeSelectedPDF
        );
    }
}


async function handlePDFChange(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) return;


    if (
        file.type !==
            'application/pdf' &&
        !file.name
            .toLowerCase()
            .endsWith('.pdf')
    ) {

        alert(
            'Please select a PDF file.'
        );

        event.target.value = '';

        return;
    }


    try {

        const dataUrl =
            await readFileAsDataURL(
                file
            );


        selectedPDF = {

            file,

            dataUrl,

            name:
                file.name,

            mimeType:
                file.type ||
                'application/pdf'
        };


        createPDFPreview(
            file
        );


        messageInput?.focus();

    } catch (error) {

        console.error(
            'PDF read error:',
            error
        );

        alert(
            'Could not read the PDF file.'
        );
    }
}


// ==========================================
// IMAGE PREVIEW
// ==========================================

function createImagePreview(file) {

    removeExistingImagePreview();


    const preview =
        document.createElement(
            'div'
        );


    preview.className =
        'selected-image-preview';


    const imageUrl =
        URL.createObjectURL(
            file
        );


    preview.innerHTML = `
        <img
            src="${imageUrl}"
            alt="Selected image"
        >

        <div class="image-preview-info">
            <strong>
                ${escapeHtml(file.name)}
            </strong>

            <small>
                Image selected
            </small>
        </div>

        <button
            type="button"
            class="remove-image-btn"
            aria-label="Remove image"
        >
            ×
        </button>
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
        preview.querySelector(
            '.remove-image-btn'
        );


    if (removeBtn) {

        removeBtn.addEventListener(
            'click',
            removeSelectedImage
        );
    }
}


function removeExistingImagePreview() {

    const oldPreview =
        document.querySelector(
            '.selected-image-preview'
        );


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
// HISTORY
// ==========================================

function generateConversationId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();
    }


    return (
        Date.now().toString() +
        '-' +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function saveHistory() {

    try {

        localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(
                conversations
            )
        );


        if (currentConversationId) {

            localStorage.setItem(
                CURRENT_CHAT_STORAGE_KEY,
                currentConversationId
            );
        }

    } catch (error) {

        console.error(
            'Could not save chat history:',
            error
        );
    }
}


function loadHistory() {

    try {

        const stored =
            localStorage.getItem(
                HISTORY_STORAGE_KEY
            );


        if (stored) {

            const parsed =
                JSON.parse(stored);


            if (
                Array.isArray(parsed)
            ) {

                conversations =
                    parsed;

            } else {

                conversations = [];
            }

        } else {

            conversations = [];
        }


        currentConversationId =
            localStorage.getItem(
                CURRENT_CHAT_STORAGE_KEY
            );

    } catch (error) {

        console.error(
            'Could not load chat history:',
            error
        );

        conversations = [];

        currentConversationId =
            null;
    }
}


function getCurrentConversation() {

    if (!currentConversationId) {
        return null;
    }


    return conversations.find(
        conversation =>
            conversation.id ===
            currentConversationId
    ) || null;
}


function createConversation() {

    const now =
        Date.now();


    const conversation = {

        id:
            generateConversationId(),

        title:
            'New Chat',

        createdAt:
            now,

        updatedAt:
            now,

        messages:
            []
    };


    conversations.push(
        conversation
    );


    currentConversationId =
        conversation.id;


    saveHistory();

    renderConversationList();


    return conversation;
}


function ensureCurrentConversation() {

    let conversation =
        getCurrentConversation();


    if (!conversation) {

        conversation =
            createConversation();
    }


    return conversation;
}


function makeConversationTitle(
    text
) {

    if (!text) {
        return 'New Chat';
    }


    const cleanText =
        String(text)
            .replace(/\s+/g, ' ')
            .trim();


    if (!cleanText) {
        return 'New Chat';
    }


    if (cleanText.length <= 42) {
        return cleanText;
    }


    return (
        cleanText.substring(
            0,
            42
        ) + '…'
    );
}


function saveChatMessage(
    role,
    text
) {

    const conversation =
        ensureCurrentConversation();


    if (
        !Array.isArray(
            conversation.messages
        )
    ) {

        conversation.messages =
            [];
    }


    conversation.messages.push({

        role,

        text:
            String(text || ''),

        createdAt:
            Date.now()
    });


    if (
        role === 'user' &&
        (
            !conversation.title ||
            conversation.title ===
                'New Chat'
        )
    ) {

        conversation.title =
            makeConversationTitle(
                text
            );
    }


    conversation.updatedAt =
        Date.now();


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
            <div class="welcome-icon">
                ✦
            </div>

            <h1>
                Welcome to Infinity AI
            </h1>

            <p>
                Your intelligent AI assistant is ready.
            </p>
        </div>
    `;
}


function renderConversationMessages(
    conversation
) {

    clearChatView();


    if (
        !conversation ||
        !Array.isArray(
            conversation.messages
        ) ||
        conversation.messages.length === 0
    ) {

        showWelcomeMessage();

        return;
    }


    conversation.messages.forEach(
        message => {

            let type = 'ai';


            if (
                message.role === 'user'
            ) {

                type = 'user';
            }


            if (
                message.role === 'error'
            ) {

                type = 'error';
            }


            addMessageBubble(
                message.text || '',
                type
            );
        }
    );


    scrollToBottom();
}


function loadConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            item =>
                item.id ===
                conversationId
        );


    if (!conversation) return;


    currentConversationId =
        conversation.id;


    saveHistory();


    renderConversationMessages(
        conversation
    );


    closeHistory();


    messageInput?.focus();
}


function deleteConversation(
    conversationId
) {

    const index =
        conversations.findIndex(
            conversation =>
                conversation.id ===
                conversationId
        );


    if (index === -1) {
        return;
    }


    conversations.splice(
        index,
        1
    );


    if (
        currentConversationId ===
        conversationId
    ) {

        if (
            conversations.length > 0
        ) {

            conversations.sort(
                (a, b) =>
                    (b.updatedAt || 0) -
                    (a.updatedAt || 0)
            );


            currentConversationId =
                conversations[0].id;


            renderConversationMessages(
                conversations[0]
            );

        } else {

            currentConversationId =
                null;


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

    removeSelectedImage();

    removeSelectedPDF();


    currentConversationId =
        null;


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

function renderConversationList(
    filter = ''
) {

    if (!conversationList) {
        return;
    }


    const oldItems =
        conversationList.querySelectorAll(
            '.conversation-item'
        );


    oldItems.forEach(
        item => item.remove()
    );


    const emptyHistory =
        document.getElementById(
            'emptyHistory'
        );


    let sorted =
        [...conversations].sort(
            (a, b) =>
                (b.updatedAt || 0) -
                (a.updatedAt || 0)
        );


    const search =
        String(filter || '')
            .trim()
            .toLowerCase();


    if (search) {

        sorted =
            sorted.filter(
                conversation => {

                    const title =
                        String(
                            conversation.title ||
                            ''
                        ).toLowerCase();


                    const messages =
                        Array.isArray(
                            conversation.messages
                        )
                            ? conversation.messages
                                .map(
                                    message =>
                                        message.text ||
                                        ''
                                )
                                .join(' ')
                                .toLowerCase()
                            : '';


                    return (
                        title.includes(
                            search
                        ) ||
                        messages.includes(
                            search
                        )
                    );
                }
            );
    }


    if (sorted.length === 0) {

        if (emptyHistory) {

            emptyHistory.style.display =
                'flex';


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

        emptyHistory.style.display =
            'none';
    }


    sorted.forEach(
        conversation => {

            const item =
                document.createElement(
                    'div'
                );


            item.className =
                'conversation-item';


            if (
                conversation.id ===
                currentConversationId
            ) {

                item.classList.add(
                    'active'
                );
            }


            const title =
                escapeHtml(
                    conversation.title ||
                    'New Chat'
                );


            const messageCount =
                Array.isArray(
                    conversation.messages
                )
                    ? conversation.messages.length
                    : 0;


            const timeText =
                formatHistoryTime(
                    conversation.updatedAt
                );


            item.innerHTML = `
                <button
                    type="button"
                    class="conversation-main"
                    data-conversation-id="${escapeHtml(conversation.id)}"
                >
                    <span class="conversation-icon">
                        💬
                    </span>

                    <span class="conversation-details">
                        <strong>
                            ${title}
                        </strong>

                        <small>
                            ${messageCount}
                            message${messageCount === 1 ? '' : 's'}
                            •
                            ${timeText}
                        </small>
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


            conversationList.appendChild(
                item
            );
        }
    );
}


function formatHistoryTime(
    timestamp
) {

    if (!timestamp) {
        return '';
    }


    const date =
        new Date(timestamp);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '';
    }


    const now =
        new Date();


    const sameDay =
        date.getFullYear() ===
            now.getFullYear() &&
        date.getMonth() ===
            now.getMonth() &&
        date.getDate() ===
            now.getDate();


    if (sameDay) {

        return date.toLocaleTimeString(
            [],
            {
                hour: 'numeric',
                minute: '2-digit'
            }
        );
    }


    const yesterday =
        new Date(now);


    yesterday.setDate(
        yesterday.getDate() - 1
    );


    const isYesterday =
        date.getFullYear() ===
            yesterday.getFullYear() &&
        date.getMonth() ===
            yesterday.getMonth() &&
        date.getDate() ===
            yesterday.getDate();


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


    historyOverlay.classList.add(
        'show'
    );


    historyOverlay.setAttribute(
        'aria-hidden',
        'false'
    );


    renderConversationList(
        historySearchInput?.value || ''
    );


    setTimeout(
        () => {
            historySearchInput?.focus();
        },
        100
    );
}


function closeHistory() {

    if (!historyOverlay) {
        return;
    }


    historyOverlay.classList.remove(
        'show'
    );


    historyOverlay.setAttribute(
        'aria-hidden',
        'true'
    );
}


// ==========================================
// HISTORY EVENTS
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
                    deleteButton.dataset
                        .deleteId;


                const conversation =
                    conversations.find(
                        item =>
                            item.id === id
                    );


                if (conversation) {

                    const confirmed =
                        confirm(
                            `Delete "${conversation.title || 'this chat'}"?`
                        );


                    if (confirmed) {

                        deleteConversation(
                            id
                        );
                    }
                }


                return;
            }


            const conversationButton =
                event.target.closest(
                    '[data-conversation-id]'
                );


            if (
                conversationButton
            ) {

                const id =
                    conversationButton
                        .dataset
                        .conversationId;


                loadConversation(
                    id
                );
            }
        }
    );
}


if (clearAllHistoryBtn) {

    clearAllHistoryBtn.addEventListener(
        'click',
        () => {

            if (
                conversations.length ===
                0
            ) {

                alert(
                    'There are no chats to clear.'
                );

                return;
            }


            const confirmed =
                confirm(
                    'Are you sure you want to delete all chat history?'
                );


            if (!confirmed) {
                return;
            }


            conversations = [];

            currentConversationId =
                null;


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


    isWaitingForResponse =
        true;


    sendBtn.disabled =
        true;


    // ======================================
    // USER MESSAGE
    // ======================================

    let visibleUserMessage =
        text;


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


    addMessageBubble(
        visibleUserMessage,
        'user'
    );


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
            '',
            'loading'
        );


    try {

        let payload = {};


        // ==================================
        // IMAGE
        // ==================================

        if (selectedImage) {

            payload = {

                message: text,

                image:
                    selectedImage.dataUrl,

                imageMimeType:
                    selectedImage.mimeType
            };
        }


        // ==================================
        // PDF
        // ==================================

        else if (selectedPDF) {

            payload = {

                message: text,

                pdf:
                    selectedPDF.dataUrl,

                pdfMimeType:
                    selectedPDF.mimeType,

                fileName:
                    selectedPDF.name
            };
        }


        // ==================================
        // NORMAL MESSAGE
        // ==================================

        else {

            payload = {

                message: text
            };
        }


        // ==================================
        // API
        // ==================================

        const response =
            await fetch(
                API_URL,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
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
        // AI TYPING ANIMATION
        // ==================================

        await typeAIResponse(
            loadingBubble,
            reply
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

        isWaitingForResponse =
            false;


        sendBtn.disabled =
            false;


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


    plusMenuOverlay.classList.add(
        'show'
    );
}


function closePlusMenu() {

    if (!plusMenuOverlay) {
        return;
    }


    plusMenuOverlay.classList.remove(
        'show'
    );
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


            if (!file) return;


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


            try {

                const dataUrl =
                    await readFileAsDataURL(
                        file
                    );


                selectedImage = {

                    file,

                    dataUrl,

                    name:
                        file.name,

                    mimeType:
                        file.type ||
                        'image/jpeg'
                };


                createImagePreview(
                    file
                );


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


            if (!file) return;


            try {

                const dataUrl =
                    await readFileAsDataURL(
                        file
                    );


                selectedImage = {

                    file,

                    dataUrl,

                    name:
                        file.name ||
                        'Camera Image',

                    mimeType:
                        file.type ||
                        'image/jpeg'
                };


                createImagePreview(
                    file
                );


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
// PLUS TOOLS
// ==========================================

toolItems.forEach(
    tool => {

        tool.addEventListener(
            'click',
            () => {

                const action =
                    tool.dataset.action ||
                    tool.getAttribute(
                        'data-tool'
                    ) ||
                    '';


                if (
                    action ===
                        'gallery' ||
                    action ===
                        'image'
                ) {

                    openGallery();

                    return;
                }


                if (
                    action ===
                    'camera'
                ) {

                    openCamera();

                    return;
                }


                if (
                    action ===
                    'pdf'
                ) {

                    openPDFPicker();

                    return;
                }


                const toolName =
                    tool.querySelector(
                        'strong'
                    )?.textContent ||
                    'This feature';


                showComingSoon(
                    toolName
                );


                closePlusMenu();
            }
        );
    }
);


// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key !==
            'Escape'
        ) {

            return;
        }


        closePlusMenu();

        closeHistory();
    }
);


// ==========================================
// BOTTOM NAV
// ==========================================

navItems.forEach(
    item => {

        item.addEventListener(
            'click',
            () => {

                navItems.forEach(
                    nav => {
                        nav.classList.remove(
                            'active'
                        );
                    }
                );


                item.classList.add(
                    'active'
                );


                const tab =
                    item.dataset.tab ||
                    item.dataset.nav ||
                    '';


                if (
                    tab ===
                    'chat'
                ) {

                    return;
                }


                if (
                    tab ===
                    'history'
                ) {

                    openHistory();

                    return;
                }


                if (
                    tab ===
                    'home'
                ) {

                    return;
                }


                if (tab) {

                    showComingSoon(
                        item.textContent.trim()
                    );
                }
            }
        );
    }
);


// ==========================================
// INITIALIZE
// ==========================================

loadHistory();


const currentConversation =
    getCurrentConversation();


if (currentConversation) {

    renderConversationMessages(
        currentConversation
    );

} else {

    showWelcomeMessage();
}


renderConversationList();


createPDFInput();


if (aiModel) {
    aiModel.value = 'gemini';
}


updateModelStatus();


const chatTab =
    document.querySelector(
        '.nav-item[data-tab="chat"], .nav-item[data-nav="chat"]'
    );


if (chatTab) {
    chatTab.classList.add('active');
}


if (messageInput) {
    messageInput.focus();
}


console.log(
    '================================'
);

console.log(
    '🚀 Infinity AI initialized'
);

console.log(
    '🧠 AI API:',
    API_URL
);

console.log(
    '💬 Chat History:',
    conversations.length
);

console.log(
    '⌨️ Typing Animation: Ready'
);

console.log(
    '📝 Markdown Renderer: Ready'
);

console.log(
    '💻 Code Blocks: Ready'
);

console.log(
    '📄 PDF system: Ready'
);

console.log(
    '🖼️ Image system: Ready'
);

console.log(
    '➕ Plus Menu: Ready'
);

console.log(
    '================================'
);
