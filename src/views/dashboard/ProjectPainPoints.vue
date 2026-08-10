<script setup>
import { onUnmounted, ref, watch } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { apiFetch } from '@/utils/apiFetch';
import { getApiBaseUrl } from '@/utils/apiBase';
import { buildDigest } from '@/utils/painPointsDigest';
import { streamText, useThinking } from '@/utils/thinking';

const projectStore = useProjectStore();

// An analysis costs minutes of CPU inference, so a repeat view of a project
// already analysed this session reads from here instead of asking again.
const cache = new Map();

const bullets = ref([]);
const shown = ref('');
const message = ref('');
const failed = ref(false);
const busy = ref(false);

const { word, seconds, start: startThinking, stop: stopThinking } = useThinking();

let cancelStream = null;
// Answers for the project the user just switched away from must never render.
// Same stale-guard the chat widget and the project store use.
let requestId = 0;

const stopStream = () => {
  if (cancelStream) {
    cancelStream();
    cancelStream = null;
  }
};

const reveal = lines => {
  stopStream();
  bullets.value = lines;
  cancelStream = streamText(lines.join('\n'), text => {
    shown.value = text;
  });
};

const clear = () => {
  stopStream();
  stopThinking();
  bullets.value = [];
  shown.value = '';
  message.value = '';
  failed.value = false;
  busy.value = false;
};

const analyse = async () => {
  const project = projectStore.selectedProject;
  if (!project) {
    clear();

    return;
  }

  const digest = buildDigest({
    forecast: projectStore.gradForecastData,
    months: projectStore.xAxisCategories.map(label => parseInt(String(label).replace(/\D/g, ''), 10)),
    techNetData: projectStore.techNetData,
    socialNetData: projectStore.socialNetData,
    selectedMonth: projectStore.selectedMonth,
    metadata: projectStore.localMetadata,
  });

  if (!digest) {
    clear();
    message.value = 'Not enough project data yet to look for pain points.';

    return;
  }

  const key = `${project.github_url || project.project_id}::${digest.month}`;
  if (cache.has(key)) {
    clear();
    reveal(cache.get(key));

    return;
  }

  const mine = ++requestId;

  clear();
  busy.value = true;
  startThinking();

  try {
    const res = await apiFetch(`${getApiBaseUrl()}/api/pain-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        github_url: project.github_url,
        project_name: project.project_name || project.name || 'this project',
        digest,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (mine !== requestId) return;

    if (!res.ok)
      throw new Error(data.message || 'Pain point analysis failed.');

    stopThinking();

    if (!data.pain_points?.length) {
      message.value = data.message || 'No pain points stood out from the available signals.';

      return;
    }

    cache.set(key, data.pain_points);
    reveal(data.pain_points);
  } catch (error) {
    if (mine !== requestId) return;

    stopThinking();
    failed.value = true;
    message.value = error.message || 'Pain point analysis is temporarily unavailable.';
  } finally {
    if (mine === requestId)
      busy.value = false;
  }
};

// Only on project change. Re-analysing per month would spend minutes of
// inference every time the slider moves, for a picture that barely shifts.
watch(
  () => projectStore.selectedProject?.github_url || projectStore.selectedProject?.project_id,
  () => { analyse(); },
  { immediate: true },
);

onUnmounted(() => {
  requestId++;
  stopStream();
  stopThinking();
});
</script>

<template>
  <div class="pain-points">
    <div class="pain-points__title">
      <VIcon size="18" class="pain-points__icon">fa-solid fa-triangle-exclamation</VIcon>
      <span>Pain Points</span>
    </div>

    <!-- Working: the rotating word carries the wait, the counter proves it is
         still moving. -->
    <div v-if="busy" class="pain-points__thinking">
      <span class="pain-points__word">{{ word }}</span>
      <span class="pain-points__elapsed">{{ seconds }}s</span>
    </div>

    <ul v-else-if="shown" class="pain-points__list">
      <li v-for="(line, index) in shown.split('\n')" :key="index">
        {{ line.replace(/^-\s*/, '') }}
      </li>
    </ul>

    <div v-else-if="message" class="pain-points__note">
      {{ message }}
      <a v-if="failed" href="#" class="pain-points__retry" @click.prevent="analyse">Try again</a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pain-points {
  margin-block-end: 20px;
  padding-block-end: 16px;
  border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pain-points__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-block-end: 10px;
  font-weight: 600;
}

.pain-points__icon {
  color: #d9730d;
}

.pain-points__thinking {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

/* The word is the whole effect, so it carries the colour rather than sitting
   in body ink. Held above 4.5:1 on both surfaces. */
.pain-points__word {
  color: #c2610a;
  font-weight: 600;
}

.pain-points__elapsed {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.8rem;
}

.pain-points__list {
  margin: 0;
  padding-inline-start: 20px;
}

.pain-points__list li {
  margin-block-end: 8px;
  line-height: 1.5;
}

.pain-points__note {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.9rem;
}

.pain-points__retry {
  margin-inline-start: 6px;
  color: rgb(var(--v-theme-link));
}

@media (prefers-color-scheme: dark) {
  .pain-points__word { color: #ff9d4d; }
  .pain-points__icon { color: #ff9d4d; }
}
</style>
