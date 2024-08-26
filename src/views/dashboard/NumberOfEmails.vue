<script setup>
import { useTheme } from 'vuetify';
import { VCard, VAvatar, VCardText, VCol, VRow } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="mx-auto" style="max-width: 344px; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <VCardText>
      <VRow>
        <!-- Left Side: Icon/Avatar
        <VCol cols="auto">
          <VAvatar
            size="40"
            color="primary"
            class="white--text"
          >
            
          </VAvatar>
        </VCol> -->

        <!-- Right Side: Statistics Info -->
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-0">Number of Emails</h6>
            <br>
          </div>
          <div class="d-flex">
            <span>
              1024
            </span>
            
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.statistics-card {
  max-width: 344px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
}

.statistics-card .v-avatar {
  background-color: #3f51b5;
  color: white;
}

.statistics-card h6 {
  font-weight: 600;
}

.statistics-card .text-success {
  color: #4caf50;
}

.statistics-card .text-caption {
  color: rgba(0, 0, 0, 0.6);
}
</style>
