<script setup>
import Actionables from '@/views/dashboard/Actionables.vue'
import CommitLinks from '@/views/dashboard/CommitLinks.vue'
import EmailLinks from '@/views/dashboard/EmailLinks.vue'
import GraduationForecast from '@/views/dashboard/GraduationForecast.vue'
import NumberOfEmails from '@/views/dashboard/NumberOfEmails.vue'
import ProjectDetails from '@/views/dashboard/ProjectDetails.vue'
import ProjectSelector from '@/views/dashboard/ProjectSelector.vue'
import SocialNetwork from '@/views/dashboard/SocialNetwork.vue'
import TechnicalNetwork from '@/views/dashboard/TechnicalNetwork.vue'

// 👉 Images
import card from '@images/cards/credit-card-primary.png'
import paypal from '@images/cards/paypal-error.png'
import email from '@images/cards/email.png'
import { VRow } from 'vuetify/components'
import EmailsPerSender from '@/views/dashboard/EmailsPerSender.vue'
import SendersBox from '@/views/dashboard/SendersBox.vue'
import NumberOfCommits from '@/views/dashboard/NumberOfCommits.vue'
import CommitsPerCommitters from '@/views/dashboard/CommitsPerCommitters.vue'
import CommitBox from '@/views/dashboard/CommitBox.vue'
import SeeAdvancedAnalytics from '@/views/dashboard/SeeAdvancedAnalytics.vue'
</script>

<template>
  <VRow>
    <!-- First Row -->
    <VCol
      cols="12"
      md="4"
    >
      <VCard style="height: 400px;"> <!-- Set a fixed height -->
        <ProjectSelector />
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="8"
    >
      <VCard style="height: 400px;"> <!-- Set a fixed height -->
        <GraduationForecast />
      </VCard>
    </VCol>
    <!-- First Row ends -->
  </VRow>
  
  <VRow>
    <!-- Second Row -->
    <VCol
      cols="12"
      md="4"
    >
      <VCard style="height: 400px;"> <!-- Set a fixed height -->
        <ProjectDetails />
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="8"
    >
      <VCard style="height: 400px;"> <!-- Set a fixed height -->
        <Actionables />
      </VCard>
    </VCol>
    <!-- Second Row ends -->
  </VRow>
    
  <VRow>
    <!-- Third Row -->
    <VCol
      cols="12"
      sm="12"
    >
      <SeeAdvancedAnalytics/>
    </VCol>
    <!-- Third Row ends -->
  </VRow>

  <VRow>
    <!-- Fourth Row: Social and Technical Network Cards -->
    <VCol
      cols="12"
      md="6"
      order="1"
    >
      <VCard style="height: 400px;"> <!-- Set a fixed height -->
        <SocialNetwork />
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="6"
      order="1"
    >
      <VCard style="height: 400px;"> <!-- Set a fixed height -->
        <TechnicalNetwork />
      </VCard>
    </VCol>
    <!-- Fourth Row ends -->
  </VRow>

  <VRow>
    <!-- Fifth Row: Commit and Email Links -->
    <VCol
      cols="6"
      md="6"
      sm="6"
    >
      <CommitLinks />
    </VCol>

    <VCol
      cols="6"
      md="6"
      sm="6"
    >
      <EmailLinks />
    </VCol>
  </VRow>

  <!-- Sixth Row: Static Info Boxes -->
  <VRow>
    <VCol
      cols="2"
      sm="2"
    >
      <NumberOfEmails />
    </VCol>

    <VCol
      cols="2"
      sm="2"
    >
      <SendersBox />
    </VCol>

    <VCol
      cols="2"
      sm="2"
    >
      <EmailsPerSender />
    </VCol>

    <VCol
      cols="2"
      sm="2"
    >
      <NumberOfCommits />
    </VCol>

    <VCol
      cols="2"
      sm="2"
    >
      <CommitBox />
    </VCol>

    <VCol
      cols="2"
      sm="2"
    >
      <CommitsPerCommitters />
    </VCol>
  </VRow>
</template>
