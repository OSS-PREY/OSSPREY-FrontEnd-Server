<script setup>
import { useTheme } from 'vuetify';
import { VCard, VCardText, VCol, VRow } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="mx-auto" style="box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);">
    <VCardText>
      <VRow>
        <VCol cols="auto">
          <div>
            <h6 class="text-h6 font-weight-medium mb-2">Senders</h6>
            <br>
          </div>
          <div class="d-flex">
            <span>7</span>
          </div>
          
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
