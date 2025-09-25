<script setup>
import { nextTick, ref, watch } from 'vue';
import logo from '@/assets/images/logo.svg';

const isOpen = ref(false);
const newMessage = ref('');
const messages = ref([
  {
    role: 'assistant',
    text: 'Hi there! This space will soon connect you with the OSSPREY team. For now, I will echo whatever you type.',
  },
]);

const messagesContainer = ref(null);
const messageInput = ref(null);

const scrollMessagesToBottom = () => {
  const container = messagesContainer.value;
  if (container)
    container.scrollTop = container.scrollHeight;
};

const toggleChat = async () => {
  isOpen.value = !isOpen.value;
};

const sendMessage = () => {
  const trimmedMessage = newMessage.value.trim();
  if (!trimmedMessage)
    return;

  messages.value.push({ role: 'user', text: trimmedMessage });
  newMessage.value = '';

  window.setTimeout(() => {
    messages.value.push({ role: 'assistant', text: `Echo: ${trimmedMessage}` });
  }, 200);
};

watch(messages, async () => {
  await nextTick();
  scrollMessagesToBottom();
}, { deep: true });

watch(isOpen, async value => {
  if (!value)
    return;

  await nextTick();
  scrollMessagesToBottom();

  if (messageInput.value?.focus)
    messageInput.value.focus();
});

const handleSubmit = () => {
  sendMessage();
};
</script>

<template>
  <div class="chat-widget">
    <VBtn
      aria-label="Open chat"
      :aria-expanded="isOpen"
      class="chat-toggle-btn"
      color="primary"
      elevation="10"
      icon
      size="large"
      variant="flat"
      @click="toggleChat"
    >
      <VAvatar class="chat-toggle-avatar" size="44">
        <VImg :src="logo" alt="OSSPREY chat" cover />
      </VAvatar>
    </VBtn>

    <VExpandTransition>
      <div
        v-if="isOpen"
        class="chatbox"
        role="dialog"
        aria-modal="false"
        aria-label="OSSPREY assistant chat"
      >
        <VCard class="chat-card" elevation="12">
          <VCardTitle class="chat-card__title">
            <div class="chat-card__title-text">
              <span class="chat-card__title-primary">Chat with OSSPREY</span>
              <span class="chat-card__title-subtitle">We're here to help.</span>
            </div>

            <VBtn
              aria-label="Close chat"
              class="chat-card__close"
              icon
              size="small"
              variant="text"
              @click="toggleChat"
            >
              <VIcon icon="fa-solid fa-xmark" />
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText class="chat-card__body">
            <div
              ref="messagesContainer"
              class="chat-messages"
              aria-live="polite"
            >
              <div
                v-for="(message, index) in messages"
                :key="`${message.role}-${index}`"
                class="chat-message"
                :class="`chat-message--${message.role}`"
              >
                <span class="chat-message__author">{{ message.role === 'user' ? 'You' : 'OSSPREY' }}</span>
                <span class="chat-message__bubble">{{ message.text }}</span>
              </div>
            </div>
          </VCardText>

          <VDivider />

          <VCardActions class="chat-card__actions">
            <VForm class="chat-input" @submit.prevent="handleSubmit">
              <VTextField
                ref="messageInput"
                v-model="newMessage"
                aria-label="Type your message"
                autocomplete="off"
                class="chat-input__field"
                density="comfortable"
                hide-details
                placeholder="Type a message and press Enter..."
                variant="solo"
                clearable
                append-inner-icon="fa-solid fa-paper-plane"
                @keyup.enter.exact.prevent="handleSubmit"
                @click:append-inner="handleSubmit"
              />
            </VForm>
          </VCardActions>
        </VCard>
      </div>
    </VExpandTransition>
  </div>
</template>

<style scoped>
.chat-widget {
  position: fixed;
  inset-inline-end: 1.5rem;
  inset-block-end: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  z-index: 2100;
}

.chat-toggle-btn {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
}

.chat-toggle-avatar {
  background-color: rgb(var(--v-theme-surface));
}

.chatbox {
  width: min(24.5rem, 88vw);
}

.chat-card {
  border-radius: 1.25rem;
  overflow: hidden;
}

.chat-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-block: 0.75rem;
}

.chat-card__title-text {
  display: flex;
  flex-direction: column;
}

.chat-card__title-primary {
  font-weight: 600;
  font-size: 1.1rem;
}

.chat-card__title-subtitle {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.chat-card__close {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.chat-card__body {
  padding-block: 1rem;
  padding-inline: 0.75rem;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 22rem;
  overflow-y: auto;
  padding-inline-end: 0.25rem;
}

.chat-message {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chat-message__author {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.chat-message__bubble {
  padding: 0.65rem 0.85rem;
  border-radius: 0.95rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  max-width: 100%;
  line-height: 1.35;
  word-break: break-word;
}

.chat-message--user {
  align-items: flex-end;
}

.chat-message--user .chat-message__bubble {
  border-bottom-right-radius: 0.4rem;
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.chat-message--assistant {
  align-items: flex-start;
}

.chat-message--assistant .chat-message__bubble {
  border-bottom-left-radius: 0.4rem;
  background-color: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}

.chat-card__actions {
  padding: 0.75rem;
  padding-block-start: 0.5rem;
}

.chat-input {
  width: 100%;
}

.chat-input__field :deep(.v-field) {
  border-radius: 999px;
}

.chat-input__field :deep(.v-field__overlay) {
  backdrop-filter: blur(6px);
}

.chat-input__field :deep(.v-field__append-inner) {
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  .chat-widget {
    inset-inline-end: 1rem;
    inset-block-end: 1rem;
  }

  .chat-toggle-btn {
    width: 3.5rem;
    height: 3.5rem;
  }
}
</style>
