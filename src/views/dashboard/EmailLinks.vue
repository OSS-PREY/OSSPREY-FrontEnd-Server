<script setup>
import { useTheme } from 'vuetify';
import { VBtn } from 'vuetify/components';

const { global } = useTheme();
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 120px;"> <!-- Reduced height to 30% -->
    <VRow no-gutters style="height: 100%;">
      <VCol
        cols="12"
        sm="12"
        order="2"
        order-sm="1"
      >
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Email Links
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <VRow class="d-flex align-center">
            <VCol cols="auto" class="d-flex align-center">
              <span>Current Node:</span>
            </VCol>
            <VCol cols="auto" class="d-flex align-center">
              <VBtn
                color="primary"
                variant="outlined"
                class="ms-2"
                style="border-radius: 12px;"
              >
                Node
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>
