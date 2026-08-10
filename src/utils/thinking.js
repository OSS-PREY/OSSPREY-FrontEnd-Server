// The "still working" effects, shared by the chat widget and the pain points
// panel so both read the same way.
//
// Answers take several seconds to minutes; a static label reads as "stuck", a
// changing one reads as "working". The streamer is purely cosmetic -- the text
// is already fully in hand, revealing it a few characters at a time is what
// makes it read as generation-in-progress.
import { ref } from 'vue';

export const THINKING_WORDS = [
  'Cooking', 'Noodling', 'Moonwalking', 'Percolating', 'Simmering', 'Puttering',
  'Ruminating', 'Doodling', 'Whirring', 'Pondering', 'Marinating', 'Tinkering',
  'Spelunking', 'Untangling', 'Rummaging', 'Brewing', 'Conjuring', 'Shimmying',
];

/** A rotating word plus a live elapsed counter. Caller owns start/stop. */
export const useThinking = () => {
  const word = ref(THINKING_WORDS[0]);
  const seconds = ref(0);

  let timer = null;

  const nextWord = () => {
    const pool = THINKING_WORDS.filter(w => w !== word.value);

    word.value = pool[Math.floor(Math.random() * pool.length)];
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    stop();

    const startedAt = Date.now();

    seconds.value = 0;
    nextWord();
    timer = window.setInterval(() => {
      seconds.value = Math.round((Date.now() - startedAt) / 1000);
      if (seconds.value % 3 === 0)
        nextWord();
    }, 1000);
  };

  return { word, seconds, start, stop };
};

/**
 * Reveal `text` progressively, handing each prefix to `onFrame`.
 *
 * Long answers must not take proportionally long to reveal, so the step scales
 * with length and the whole reveal stays around three seconds. Returns a cancel
 * function; call it on unmount and whenever the subject changes, or a stale
 * reveal keeps writing over the new one.
 */
export const streamText = (text, onFrame, { totalFrames = 150, minStep = 2 } = {}) => {
  const full = String(text ?? '');
  const step = Math.max(minStep, Math.ceil(full.length / totalFrames));

  let shown = 0;
  let timer = window.setInterval(() => {
    shown = Math.min(full.length, shown + step);
    onFrame(full.slice(0, shown), shown >= full.length);
    if (shown >= full.length && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 20);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};
