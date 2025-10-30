<script setup>
import { navigateToRepos } from '@/utils/navigation';

const router = useRouter();

const goToRepos = () => {
  navigateToRepos(router);
};

defineExpose({
  goToRepos,
});
</script>

<template>
  <VTooltip
    text="All Repos"
    location="bottom"
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        class="ms-2 font-weight-medium"
        color="primary"
        variant="tonal"
        aria-label="All Repos"
        style="text-transform: none;"
        @click="goToRepos"
      >
        All Repos
      </VBtn>
    </template>
  </VTooltip>
</template>
