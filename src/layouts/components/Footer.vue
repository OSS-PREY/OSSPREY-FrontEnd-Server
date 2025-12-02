<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { VIEW_RECORDED_EVENT, fetchUserCount, fetchViewCount } from '@/utils/viewTracking'

const viewCountText = ref('Loading...')
const userCountText = ref('Loading...')

const loadViewCount = async () => {
  const count = await fetchViewCount()
  viewCountText.value = typeof count === 'number' ? count.toLocaleString() : 'N/A'
}

const loadUserCount = async () => {
  const count = await fetchUserCount()
  userCountText.value = typeof count === 'number' ? count.toLocaleString() : 'N/A'
}

const handleViewRecorded = () => {
  loadViewCount()
}

onMounted(() => {
  loadViewCount()
  loadUserCount()
  window.addEventListener(VIEW_RECORDED_EVENT, handleViewRecorded)
})

onBeforeUnmount(() => {
  window.removeEventListener(VIEW_RECORDED_EVENT, handleViewRecorded)
})
</script>

<template>
  <div class="footer-container">
    <span class="footer-text">
      Developed at the
      <a href="https://decallab.cs.ucdavis.edu/join/" target="_blank" rel="noopener noreferrer" class="footer-link">DECAL Lab</a>, 
      in the CS Department, UC Davis, by 
      <strong>
        <a href="https://nafiz43.github.io/portfolio/" target="_blank" rel="noopener noreferrer" class="footer-link">Nafiz Imtiaz Khan</a>,
        <a href="https://github.com/priyalsoni15" target="_blank" rel="noopener noreferrer" class="footer-link">Priyal Soni</a>,
        <a href="https://www.linkedin.com/in/arjashok" target="_blank" rel="noopener noreferrer" class="footer-link">Arjun Ashok</a>,
        <a href="https://www.linkedin.com/in/sankalp-kashyap" target="_blank" rel="noopener noreferrer" class="footer-link">Sankalp Kashyap</a>
      </strong>, and
      <strong>
        <a href="https://www.cs.ucdavis.edu/~filkov/" target="_blank" rel="noopener noreferrer" class="footer-link">Vladimir Filkov</a>
      </strong>.
    </span>
    
    <span class="footer-text">
      Copyright © {{ new Date().getFullYear() }} The Regents of the
      <a
        href="https://www.ucdavis.edu/"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
        >University of California, Davis</a
      >
      campus. All rights reserved. Used with permission.
    </span>

    <span class="footer-text">
      OSSPREY is a tool to support sustainable open-source development. It provides direct analytics of project metrics, temporal AI-based sustainability forecasts, and evidence-based recommendations to improve long-term viability. [<a href="https://oss-prey.github.io/OSSPREY-Website/" target="_blank" rel="noopener noreferrer" class="footer-link">Website</a>] [<a href="https://github.com/orgs/OSS-PREY/repositories" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>]
    </span>

    <span class="footer-text">
      We’d really appreciate your thoughts on this tool. Please share your feedback here:
      <a
        href="https://forms.gle/GUQyYY6SijDbtUVe9"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
        >https://forms.gle/GUQyYY6SijDbtUVe9</a
      >
    </span>

    <span class="footer-text footer-metrics">
      <span class="footer-metrics__item">
        <strong>OSSPREY Views</strong>: {{ viewCountText }}
      </span>
      <span class="footer-metrics__item">
        <strong>Users</strong>: {{ userCountText }}
      </span>
    </span>
  </div>
</template>

<style scoped>
.footer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  text-align: center;
  font-size: 0.875rem; /* Ensures readability on all screens */
  max-width: 100%;
  overflow: hidden;
  gap: 6px; /* Adds spacing for readability */
}

.footer-text {
  display: inline-block;
  white-space: normal; /* Allows wrapping instead of forcing a single line */
  word-break: break-word; /* Prevents long text from breaking layout */
  text-align: center;
}

.footer-link {
  color: #007bff; /* Standard link color */
  text-decoration: none;
  font-weight: bold;
}

.footer-link:hover {
  text-decoration: underline;
}

.footer-metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.footer-metrics__item {
  display: block;
}
</style>
