<script setup>
import Actionables from '@/views/dashboard/Actionables.vue'
import GraduationForecast from '@/views/dashboard/GraduationForecast.vue'
import ProjectDetails from '@/views/dashboard/ProjectDetails.vue'
import ProjectSelector from '@/views/dashboard/ProjectSelector.vue'
import { default as SocialNetwork } from '@/views/dashboard/SocialNetwork.vue'
import TechnicalNetwork from '@/views/dashboard/TechnicalNetwork.vue'

// 👉 Images
import card from '@images/cards/credit-card-primary.png'
import paypal from '@images/cards/paypal-error.png'
import { VRow } from 'vuetify/components'
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
        <!-- Second Row ends-->

    </VRow>
    
  <VRow>
<!--Third row-->
    <!-- See advanced options -->
    <VCol
      cols="12"
      sm="12"
    >
      <CardStatisticsVertical
        v-bind="{
          title: 'See advanced analytics',
          image: paypal,
          change: 0
        }"
      />
    </VCol>
    </VRow>
    <!--Third row ends-->

  <VRow>
    <!-- Fourth Row -->
    <!-- 👉 Total Revenue 1 (50% width) -->
    <VCol
      cols="12"
      md="6"
      order="1"
    >
      <SocialNetwork />
    </VCol>

    <!-- 👉 Social & Technical n/w -->
    <VCol
      cols="12"
      md="6"
      order="1"
    >
      <TechnicalNetwork />
    </VCol>
    <!-- Fourth Row ends -->
  </VRow>
    

  <VRow>
 <!-- Fifth Row (Email and Commit links) -->
    <!-- 👉 Profit 1 (Same size as Transactions) -->
    <VCol
      cols="6"
      md="6"
      sm="6"
    >
        <CardStatisticsVertical
            v-bind="{
              title: 'Payments',
              image: paypal,
              stats: '$2,468',
            }"
          />
      </VCol>

      <VCol
      cols="6"
      md="6"
      sm="6">
       <CardStatisticsVertical
            v-bind="{
              title: 'Transactions',
              image: card,
              stats: '$14,857',
            }"
          />
      </VCol>
    </VRow>

        <!-- 👉 Transactions -->
   
        <!--Sixth Row (static info 6 boxes)-->
<VRow>
        <!-- This is where the three boxes for static data would go -->
        <!-- Parent VCol for the first VRow -->
        <VCol
          cols="2"
          sm="2"
        >
            <CardStatisticsVertical
                v-bind="{
                  title: 'Payments',
                  image: paypal,
                  stats: '$2,468',
                }"
              />
          </VCol>

            <VCol
              cols="2"
              sm="2"
            >
              <CardStatisticsVertical
                v-bind="{
                  title: 'Transactions',
                  image: card,
                  stats: '$14,857',
                }"
              />
            </VCol>

            <VCol
              cols="2"
              sm="2"
            >
              <CardStatisticsVertical
                v-bind="{
                  title: 'Transactions',
                  image: card,
                  stats: '$14,857',
                }"
              />
            </VCol>
  <VCol
            cols="2"
            sm="2"
          >
              <CardStatisticsVertical
                  v-bind="{
                    title: 'Payments',
                    image: paypal,
                    stats: '$2,468',
                  }"
                />
              </VCol>

              <VCol
                cols="2"
                sm="2"
              >
                <CardStatisticsVertical
                  v-bind="{
                    title: 'Transactions',
                    image: card,
                    stats: '$14,857',
                  }"
                />
              </VCol>

              <VCol
                cols="2"
                sm="2"
              >
                <CardStatisticsVertical
                  v-bind="{
                    title: 'Transactions',
                    image: card,
                    stats: '$14,857',
                  }"
                />
              </VCol>
            </VRow>
      

    
</template>
