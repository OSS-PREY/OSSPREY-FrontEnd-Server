<script setup>
import { useTheme } from 'vuetify';

const { global } = useTheme()
</script>

<template>
  <VCard class="text-center text-sm-start" style="height: 400px;">
    <VRow no-gutters style="height: 100%;">
      <VCol
        cols="12"
        sm="12"
        order="2"
        order-sm="1"
      >
        <VCardItem class="pb-3">
          <VCardTitle class="text-primary">
            Project details
          </VCardTitle>
        </VCardItem>

        <VCardText style="height: 100%;">
          <!-- Project Name -->
          <VRow class="mb-1" style="height: 49%;">
            <VCol cols="12" class="d-flex align-items-center">
              <strong>About:</strong> &nbsp; [Your About Text Here]
            </VCol>
          </VRow>

          <!-- Status -->
          <VRow class="mb-1" style="height: 14%;">
            <VCol cols="12" class="d-flex align-items-center">
              <strong>Status:</strong> &nbsp; [Your Status Here]
            </VCol>
          </VRow>

          <!-- Sponsor -->
          <VRow class="mb-1" style="height: 19%;">
            <VCol cols="12" class="d-flex align-items-center">
              <strong>Sponsor:</strong> &nbsp; [Your Sponsor Name Here]
            </VCol>
          </VRow>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>
