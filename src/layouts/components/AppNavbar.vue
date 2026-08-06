<script setup>
import { useRoute } from 'vue-router';
import NavbarActions from '@/layouts/components/NavbarActions.vue';
import NavbarBranding from '@/layouts/components/NavbarBranding.vue';

const route = useRoute();

// Pages reachable from anywhere. NavbarActions already covers All Repos,
// Profile and Log Out; these are the destinations it does not carry.
const links = [
  { title: 'Dashboard', to: '/dashboard', icon: 'bx-bar-chart-alt-2' },
  { title: 'Account Settings', to: '/account-settings', icon: 'bx-cog' },
];

const isCurrent = to => (route.path === to ? 'page' : undefined);
</script>

<template>
  <div class="app-navbar">
    <RouterLink to="/dashboard" class="app-navbar__home" aria-label="OSSPREY home">
      <NavbarBranding />
    </RouterLink>

    <nav class="app-navbar__links" aria-label="Main">
      <VBtn
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :aria-current="isCurrent(link.to)"
        :active="route.path === link.to"
        variant="text"
        class="app-navbar__link"
      >
        <template #prepend><VIcon :icon="link.icon" /></template>
        {{ link.title }}
      </VBtn>
    </nav>

    <NavbarActions />
  </div>
</template>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  inline-size: 100%;
}

.app-navbar__home {
  text-decoration: none;
  color: inherit;
  border-radius: 6px;
}

/* Keyboard users must be able to see where they are. */
.app-navbar__home:focus-visible,
.app-navbar__link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.app-navbar__links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-inline-start: auto;
}

.app-navbar__link {
  text-transform: none;
}

@media (max-width: 767px) {
  /* Labels would wrap the bar on small screens; NavbarActions keeps the
     icon-only controls, and these two stay reachable as icons. */
  .app-navbar__link :deep(.v-btn__content) {
    font-size: 0;
  }

  .app-navbar__link :deep(.v-icon) {
    font-size: 1.25rem;
  }
}
</style>
