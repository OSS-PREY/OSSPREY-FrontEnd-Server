<template>
    <div class="chatbot-container">
      <!-- Floating Chat Button -->
      <transition name="button-fade">
        <div 
          v-if="!isChatOpen" 
          class="chat-button"
          @click="toggleChat"
        >
          <!-- OSSPREY Logo -->
          <img src="/ospex-logo.png" alt="OSSPREY Logo" class="logo-img" />
        </div>
      </transition>
  
      <!-- Chat Window -->
      <transition name="chat-slide">
        <div v-if="isChatOpen" :class="['chat-window', { 'maximized': isMaximized }]">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-header-content">
              <img src="/ospex-logo.png" alt="OSSPREY Logo" class="header-logo" />
              <div class="chat-title">
                <h3>OSSPREY Assistant</h3>
                <span class="chat-subtitle">AI Agent</span>
              </div>
            </div>
            <div class="chat-controls">
              <button @click="toggleMaximize" class="control-btn maximize-btn">
                <svg v-if="!isMaximized" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              </button>
              <button @click="minimizeChat" class="control-btn minimize-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button @click="toggleChat" class="control-btn close-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
  
          <!-- Chat Messages -->
          <div class="chat-messages" ref="messagesContainer">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="message bot-message">
              <img src="/ospex-logo.png" alt="OSSPREY Logo" class="message-logo" />
              <div class="message-content">
                <div class="message-text">
                  Hi there 👋<br><br>
                  You are now speaking with OSSPREY Assistant. How can I help you analyze your open source project sustainability?
                </div>
              </div>
            </div>
  
            <!-- Chat Messages -->
            <div 
              v-for="(message, index) in messages" 
              :key="index" 
              :class="['message', message.type === 'user' ? 'user-message' : 'bot-message']"
            >
              <div v-if="message.type === 'bot'" class="message-avatar">
                <img src="/ospex-logo.png" alt="OSSPREY Logo" class="message-logo" />
              </div>
              <div class="message-content">
                <div class="message-text">
                  {{ message.text }}
                </div>
                <div class="message-time">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
  
            <!-- Typing Indicator -->
            <div v-if="isTyping" class="message bot-message">
              <img src="/ospex-logo.png" alt="OSSPREY Logo" class="message-logo" />
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Chat Input -->
          <div class="chat-input-container">
            <div class="chat-input-wrapper">
              <input
                v-model="currentMessage"
                @keypress.enter="sendMessage"
                @keypress="handleTyping"
                type="text"
                placeholder="Ask a question..."
                class="chat-input"
                :disabled="isTyping"
              />
              <button 
                @click="sendMessage" 
                class="send-button"
                :disabled="!currentMessage.trim() || isTyping"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            </div>
          </div>
  
          <!-- Privacy Notice -->
          <div class="privacy-notice">
            By chatting with us, you agree to the monitoring and recording of this chat to deliver our services and processing of your personal data in accordance with our Privacy Policy. 
            <a href="https://oss-prey.github.io/OSSPREY-Website/" target="_blank" rel="noopener noreferrer" class="privacy-link">See our Privacy Policy</a>.
          </div>
        </div>
      </transition>
  
  
    </div>
  </template>
  
  <script setup>
  import { ref, nextTick, onMounted } from 'vue'
  
  const isChatOpen = ref(false)
  const isMinimized = ref(false)
  const currentMessage = ref('')
  const messages = ref([])
  const isTyping = ref(false)
  const isMaximized = ref(false)
  const unreadCount = ref(0)
  const messagesContainer = ref(null)
  
  const toggleChat = () => {
    if (isChatOpen.value) {
      // Closing chat
      isChatOpen.value = false
      isMinimized.value = false
    } else {
      // Opening chat
      isChatOpen.value = true
      isMinimized.value = false
      unreadCount.value = 0
      nextTick(() => {
        scrollToBottom()
      })
    }
  }
  
  const toggleMaximize = () => {
    isMaximized.value = !isMaximized.value
    nextTick(() => {
      scrollToBottom()
    })
  }
  
  const minimizeChat = () => {
    isChatOpen.value = false
    isMinimized.value = false
  }
  
  const restoreChat = () => {
    isChatOpen.value = true
    isMinimized.value = false
    unreadCount.value = 0
    nextTick(() => {
      scrollToBottom()
    })
  }
  
  const sendMessage = async () => {
    if (!currentMessage.value.trim() || isTyping.value) return
  
    const userMessage = {
      type: 'user',
      text: currentMessage.value,
      timestamp: new Date()
    }
  
    messages.value.push(userMessage)
    const messageToEcho = currentMessage.value
    currentMessage.value = ''
  
    await nextTick()
    scrollToBottom()
  
    // Show typing indicator
    isTyping.value = true
    
    // Simulate bot response delay
    setTimeout(() => {
      isTyping.value = false
      
      const botMessage = {
        type: 'bot',
        text: `You said: "${messageToEcho}". This is an echo response while we prepare the AI backend integration.`,
        timestamp: new Date()
      }
  
      messages.value.push(botMessage)
      
      // If chat is minimized, increment unread count
      if (isMinimized.value) {
        unreadCount.value++
      }
  
      nextTick(() => {
        scrollToBottom()
      })
    }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
  }
  
  const handleTyping = () => {
    // You can add typing indicators here if needed
  }
  
  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
  
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  onMounted(() => {
    // This function for writing initialization logic
  })
  </script>
  
  <style scoped>
  .chatbot-container {
    position: fixed;
    bottom: 20px;
    right: 24px;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .chat-button {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    animation: pulse 2s infinite;
  }
  
  .chat-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
  }
  
  .button-fade-enter-active, .button-fade-leave-active {
    transition: all 0.2s ease;
  }
  
  .button-fade-enter-from {
    opacity: 0;
    transform: scale(0.8);
  }
  
  .button-fade-leave-to {
    opacity: 0;
    transform: scale(0.8);
  }
  
  .logo-img, .header-logo, .message-logo {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .logo-img {
    width: 32px;
    height: 32px;
  }
  
  .header-logo {
    width: 24px;
    height: 24px;
  }
  
  .message-logo {
    width: 20px;
    height: 20px;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
    50% {
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8);
    }
    100% {
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
  }
  
  @keyframes bounce {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(-3px);
    }
  }
  
  .chat-window {
    width: 380px;
    height: 600px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
  }
  
  .chat-window.maximized {
    width: 90vw;
    height: 90vh;
    max-width: 1200px;
    max-height: 800px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
  }
  
  .chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .chat-header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .bird-logo-small {
    font-size: 20px;
  }
  
  .chat-title h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    letter-spacing: -0.01em;
  }
  
  .chat-subtitle {
    font-size: 12px;
    opacity: 0.9;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .chat-controls {
    display: flex;
    gap: 8px;
  }
  
  .control-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #fafafa;
  }
  
  .message {
    display: flex;
    gap: 12px;
    animation: messageSlide 0.3s ease-out;
  }
  
  .user-message {
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .user-avatar {
    background: #6b7280;
    color: white;
  }
  
  .message-content {
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .message-text {
    background: white;
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .user-message .message-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .message-time {
    font-size: 11px;
    color: #6b7280;
    padding: 0 4px;
  }
  
  .user-message .message-time {
    text-align: right;
  }
  
  @keyframes messageSlide {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .typing-indicator {
    background: white;
    padding: 12px 16px;
    border-radius: 18px;
    display: flex;
    gap: 4px;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .typing-indicator span {
    width: 6px;
    height: 6px;
    background: #6b7280;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }
  
  .chat-input-container {
    padding: 16px;
    background: white;
    border-top: 1px solid #e5e7eb;
  }
  
  .chat-input-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .chat-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 24px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    background: #f9fafb;
  }
  
  .chat-input:focus {
    border-color: #667eea;
    background: white;
  }
  
  .send-button {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .send-button:hover:not(:disabled) {
    transform: scale(1.1);
  }
  
  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .privacy-notice {
    padding: 12px 16px;
    background: #f3f4f6;
    font-size: 11px;
    color: #6b7280;
    line-height: 1.4;
    border-top: 1px solid #e5e7eb;
  }
  
  .privacy-link {
    color: #667eea;
    text-decoration: none;
  }
  
  .privacy-link:hover {
    text-decoration: underline;
  }
  
  .chat-slide-enter-active {
    transition: all 0.25s ease;
  }
  
  .chat-slide-leave-active {
    transition: all 0.2s ease;
  }
  
  .chat-slide-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  
  .chat-slide-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  
  @media (max-width: 480px) {
    .chat-window {
      width: calc(100vw - 40px);
      height: calc(100vh - 40px);
      max-height: 600px;
    }
    
    .chat-window.maximized {
      width: 100vw;
      height: 100vh;
      border-radius: 0;
      top: 0;
      left: 0;
      transform: none;
    }
    
    .chatbot-container {
      bottom: 10px;
      right: 16px;
    }
  }
  </style>