<template>
  <div class="footer-container">
    <span class="footer-text">
      Developed at the 
      <a href="https://decallab.cs.ucdavis.edu/join/" target="_blank" rel="noopener noreferrer" class="footer-link">DECAL Lab</a>, 
      in the CS Department, UC Davis, by 
      <strong>
        <a href="https://www.linkedin.com/in/priyal-soni-150" target="_blank" rel="noopener noreferrer" class="footer-link">Priyal Soni</a>, 
        <a href="https://nafiz43.github.io/portfolio/" target="_blank" rel="noopener noreferrer" class="footer-link">Nafiz Imtiaz Khan</a>, 
        <a href="https://www.linkedin.com/in/arjashok" target="_blank" rel="noopener noreferrer" class="footer-link">Arjun Ashok</a>
      </strong>, and 
      <strong>
        <a href="https://www.cs.ucdavis.edu/~filkov/" target="_blank" rel="noopener noreferrer" class="footer-link">Vladimir Filkov</a>
      </strong>.
    </span>
    
    <span class="footer-text">
      Copyright © {{ new Date().getFullYear() }} The Regents of the University of California, Davis campus. All rights reserved. Used with permission.
    </span>

    <span class="footer-text">
      OSPEx is a tool to support sustainable open-source development. It provides direct analytics of project metrics, temporal AI-based sustainability forecasts, and evidence-based recommendations to improve long-term viability.
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
</style>
