<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { apiFetch } from '@/utils/apiFetch';
import { getApiBaseUrl } from '@/utils/apiBase';

const chatButtonImage =
  'https://raw.githubusercontent.com/OSS-PREY/OSSPREY-Website/refs/heads/main/static/images/favicon.ico';

const projectStore = useProjectStore();

// Only GitHub-backed repos can be chatted about. Apache foundation projects
// store 'N/A' here and Eclipse ones store a projects.eclipse.org page, so the
// widget has to recognise both as "nothing to chat about" rather than sending
// them to the backend and getting a bad-URL error back.
const repoUrl = computed(() => {
  const url = projectStore.selectedProject?.github_url;

  return /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(url || '') ? url : null;
});

const repoLabel = computed(() =>
  (repoUrl.value || '').replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, ''));

const NO_REPO_MESSAGE =
  'Load a repository from a GitHub link first, then I can answer questions about it.';

const isOpen = ref(false);
const newMessage = ref('');
const messages = ref([]);
const projectId = ref(null);
const conversationState = ref(null);
const busy = ref(false);

// Answers for the repo the user just switched away from must never render. Same
// stale-guard pattern the project store uses for its own in-flight requests.
let requestId = 0;

const messagesContainer = ref(null);
const messageInput = ref(null);

const say = text => messages.value.push({ role: 'assistant', text });

const scrollMessagesToBottom = () => {
  const container = messagesContainer.value;
  if (container)
    container.scrollTop = container.scrollHeight;
};

const startSession = async () => {
  if (!repoUrl.value || busy.value)
    return;

  const mine = ++requestId;

  busy.value = true;
  say(`Preparing context for ${repoLabel.value} — first-time setup can take a few minutes...`);

  try {
    const res = await apiFetch(`${getApiBaseUrl()}/api/chat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ github_url: repoUrl.value }),
    });

    const data = await res.json().catch(() => ({}));
    if (mine !== requestId)
      return;

    if (!res.ok)
      throw new Error(data.message || 'Could not prepare that repository for chat.');

    projectId.value = data.project_id;
    say(`I've loaded ${repoLabel.value}. Ask me anything about it — governance, commits, issues, or general questions.`);
  } catch (error) {
    if (mine !== requestId)
      return;

    say(`${error.message || 'Something went wrong.'} Send a message to try again.`);
  } finally {
    if (mine === requestId)
      busy.value = false;
  }
};

const sendMessage = async () => {
  const question = newMessage.value.trim();
  if (!question || busy.value)
    return;

  if (!repoUrl.value) {
    say(NO_REPO_MESSAGE);

    return;
  }

  // The session failed earlier (or never ran) - retry it before the question.
  if (!projectId.value) {
    await startSession();
    if (!projectId.value)
      return;
  }

  const mine = ++requestId;

  messages.value.push({ role: 'user', text: question });
  newMessage.value = '';
  busy.value = true;

  // Replace this slot by index when the answer lands. Mutating a pushed object
  // directly would write to the raw object, not the reactive proxy Vue renders
  // from, so the bubble would sit on "Thinking..." forever.
  messages.value.push({ role: 'assistant', text: 'Thinking...' });

  const pendingIndex = messages.value.length - 1;
  const resolve = text => {
    messages.value[pendingIndex] = { role: 'assistant', text };
  };

  try {
    const res = await apiFetch(`${getApiBaseUrl()}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId.value,
        query: question,
        conversation_state: conversationState.value,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (mine !== requestId)
      return;

    if (!res.ok)
      throw new Error(data.message || 'The assistant could not answer that just now.');

    resolve(data.response || 'No answer came back for that one.');
    conversationState.value = data.conversation_state ?? null;
  } catch (error) {
    if (mine !== requestId)
      return;

    resolve(error.message || 'The assistant is temporarily unavailable.');
  } finally {
    if (mine === requestId)
      busy.value = false;
  }
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
};

// Switching repos invalidates the whole conversation: new context, new summary.
watch(repoUrl, () => {
  requestId++;
  busy.value = false;
  projectId.value = null;
  conversationState.value = null;
  messages.value = [];
  if (isOpen.value)
    openConversation();
});

const openConversation = () => {
  if (messages.value.length)
    return;

  if (!repoUrl.value) {
    say(NO_REPO_MESSAGE);

    return;
  }

  startSession();
};

watch(messages, async () => {
  await nextTick();
  scrollMessagesToBottom();
}, { deep: true });

watch(isOpen, async value => {
  if (!value)
    return;

  openConversation();

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
      <VAvatar class="chat-toggle-avatar" size="52">
        <VImg :src="chatButtonImage" alt="OSSPREY chat" cover />
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
                :disabled="busy"
                :placeholder="busy ? 'Working on it...' : 'Type a message and press Enter...'"
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
  width: 4.5rem;
  height: 4.5rem;
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
  white-space: pre-line;
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
    width: 3.75rem;
    height: 3.75rem;
  }
}
</style>
