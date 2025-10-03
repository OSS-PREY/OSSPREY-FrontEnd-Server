<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const isMobileView = ref(false)

const updateViewport = () => {
  if (typeof window === 'undefined') return

  isMobileView.value = window.innerWidth < 768
}

onMounted(() => {
  updateViewport()
  if (typeof window !== 'undefined')
    window.addEventListener('resize', updateViewport)
})

onUnmounted(() => {
  if (typeof window !== 'undefined')
    window.removeEventListener('resize', updateViewport)
})
</script>

<template>
  <div class="branding d-flex align-center">
    <img
      src="/ospex-logo.png"
      alt="OSPEx Logo"
      class="logo me-3"
    >

    <span v-if="isMobileView">OSSPREY</span>
    <span v-else>OSSPREY (Open Source Software PRojEct sustainabilitY tracker)</span>
  </div>
</template>

<style scoped>
.logo {
  height: 32px;
  width: auto;
}
</style>
