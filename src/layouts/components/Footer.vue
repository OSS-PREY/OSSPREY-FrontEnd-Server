<template>
  <div class="footer-container">
    <span class="footer-text">
      Developed at 
      <a
        href="https://decallab.cs.ucdavis.edu/join/"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >DECAL Lab</a> 
      in CS Department @ UC Davis by <strong>Priyal Soni, Nafiz Imtiaz Khan, Arjun Ashok</strong> and <strong> Vladimir Filkov</strong>
    </span>
    <span class="footer-text">
      Copyright © {{ new Date().getFullYear() }} The Regents of the University of California, Davis campus. All Rights Reserved. Used with permission.
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
