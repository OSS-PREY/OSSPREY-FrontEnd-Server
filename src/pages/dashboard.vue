<script setup>
import { ref } from 'vue'; // Import ref to manage collapse state
import Actionables from '@/views/dashboard/Actionables.vue';
import GraduationForecast from '@/views/dashboard/GraduationForecast.vue';
import SocialNetworkNode from '@/views/dashboard/SocialNetworkNode.vue';
import TechnicalNetworkNode from '@/views/dashboard/TechnicalNetworkNode.vue';
import NumberOfEmails from '@/views/dashboard/NumberOfEmails.vue';
import ProjectDetails from '@/views/dashboard/ProjectDetails.vue';
import ProjectSelector from '@/views/dashboard/ProjectSelector.vue';
import SocialNetwork from '@/views/dashboard/SocialNetwork.vue';
import TechnicalNetwork from '@/views/dashboard/TechnicalNetwork.vue';
import EmailsPerSender from '@/views/dashboard/EmailsPerSender.vue';
import SendersBox from '@/views/dashboard/SendersBox.vue';
import NumberOfCommits from '@/views/dashboard/NumberOfCommits.vue';
import CommitsPerCommitters from '@/views/dashboard/CommitsPerCommitters.vue';
import SeeAdvancedAnalytics from '@/views/dashboard/SeeAdvancedAnalytics.vue';
import Committers from '@/views/dashboard/Committers.vue';
import Title from '@/views/dashboard/Title.vue';
const isCollapsed = ref(true); // Manage collapse state here

// Function to toggle the collapse state for all cards
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <VRow>
    <VCol cols="12" sm="12">
      <VCard style="height: 80px;">
        <Title />
      </VCard>
    </VCol>
  </VRow>


  <VRow>
    <!-- First Row -->
    <VCol cols="12" md="6">
      <VCard style="height: 400px;">
        <ProjectSelector />
      </VCard>
    </VCol>

    <VCol cols="12" md="6">
      <VCard style="height: 400px;">
        <GraduationForecast />
      </VCard>
    </VCol>
    
  </VRow>

  <VRow>

    <VCol cols="12" md="6">
      
      <VCard style="height: 400px;">
        <ProjectDetails />
      </VCard>
    </VCol>
    <!-- Second Row -->
    

    <VCol cols="12" md="6">
      <VCard style="height: 400px;">
        <Actionables />
      </VCard>
    </VCol>
  </VRow>

  <VRow>
    <!-- Third Row: See Advanced Analytics -->
    <VCol cols="12" sm="12">
      <SeeAdvancedAnalytics :isCollapsed="isCollapsed" @toggleCollapse="toggleCollapse" />
    </VCol>
  </VRow>

  

  <!-- Fourth and Fifth Rows that collapse based on isCollapsed -->
  <transition name="fade">
    <div v-show="!isCollapsed">

      <!-- [Temporary] Fifth Row: Commit and Email Links --> 
      <!-- <VRow>
        
        <VCol cols="6" md="6" sm="6">
          <CurrentProject />
        </VCol>

        <VCol cols="6" md="6" sm="6">
          <CurrentMonth />
        </VCol>
      </VRow> -->

      <VRow>
        <!-- Fourth Row: Social and Technical Network Cards -->
        <VCol cols="12" md="6">
          <VCard style="height: 400px;">
            <SocialNetwork />
          </VCard>
        </VCol>

        <VCol cols="12" md="6">
          <VCard style="height: 400px;">
            <TechnicalNetwork />
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        
        <VCol cols="6" md="6" sm="6">
          <SocialNetworkNode />
        </VCol>

        <VCol cols="6" md="6" sm="6">
          <TechnicalNetworkNode />
        </VCol>
      </VRow>

      <VRow>
        <!-- Sixth Row: Static Info Boxes -->
        <VCol cols="12" md="2">
          <NumberOfEmails />
        </VCol>

        <VCol cols="12" md="2">
          <SendersBox />
        </VCol>

        <VCol cols="12" md="2">
          <EmailsPerSender />
        </VCol>

        <VCol cols="12" md="2">
          <NumberOfCommits />
        </VCol>

        <VCol cols="12" md="2">
          <Committers />
        </VCol>

        <VCol cols="12" md="2">
          <CommitsPerCommitters />
        </VCol>
      </VRow>
    </div>
  </transition>
</template>
