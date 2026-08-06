<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import misc404 from '@images/pages/404.png'

const route = useRoute()

// Signed-in visitors get sent back into the app; everyone else to sign-in.
const isSignedIn = computed(() => Boolean(localStorage.getItem('user')))
</script>

<template>
  <VContainer class="d-flex flex-column align-center justify-center text-center py-16">
    <h1 class="text-h2 font-weight-bold mb-2">404</h1>
    <h2 class="text-h5 mb-2">Page not found</h2>
    <p class="text-body-1 text-medium-emphasis mb-6">
      We couldn't find <code>{{ route.fullPath }}</code>.
    </p>

    <div class="d-flex flex-wrap justify-center gap-3 mb-8">
      <VBtn v-if="isSignedIn" color="primary" to="/dashboard">
        <template #prepend><VIcon icon="bx-bar-chart-alt-2" /></template>
        Go to Dashboard
      </VBtn>
      <VBtn v-if="isSignedIn" variant="outlined" to="/repos">
        <template #prepend><VIcon icon="bx-list-ul" /></template>
        All Repos
      </VBtn>
      <VBtn v-else color="primary" to="/login">
        <template #prepend><VIcon icon="bx-log-in" /></template>
        Go to Login
      </VBtn>
    </div>

    <img :src="misc404" alt="" class="error-art" />
  </VContainer>
</template>

<style scoped>
.error-art {
  max-inline-size: 400px;
  inline-size: 100%;
  block-size: auto;
}
</style>
