<template>
  <app-page-wrapper
    :container-class="'md:col-start-1 md:col-span-6 lg:col-start-2 lg:col-span-10'"
  >
    <div class="panel !p-8 !pb-16 paywall-page">
      <div class="flex justify-between">
        <div class="flex gap-4">
          <div
            class="h-12 w-12 flex items-center justify-center rounded-lg bg-brand-500"
          >
            <i
              class="text-white text-2xl"
              :class="page.icon"
            />
          </div>
          <div class="flex flex-col">
            <div class="text-2xs text-brand-500">
              Growth feature
            </div>
            <h5 class="text-gray-900">
              {{ page.headerTitle }}
            </h5>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-gray-500 italic text-2xs">
            Available in Growth plan
          </div>
          <router-link
            :to="{
              name: 'settings',
              query: { activeTab: 'plans' }
            }"
          >
            <el-button class="btn btn--md btn--primary"
              >Upgrade plan</el-button
            >
          </router-link>
        </div>
      </div>

      <el-divider class="!mt-8 !mb-11 border-gray-200" />

      <div class="grid grid-cols-10 gap-y-12">
        <div class="text-gray-900 col-start-2 col-span-8">
          <h4 class="mb-4">
            {{ page.title }}
          </h4>
          <div class="text-xs">
            {{ page.mainContent }}
          </div>
        </div>

        <div class="bg-image">
          <img
            class="w-9/12 mx-auto mt-8"
            :src="page.imageSrc"
          />
        </div>

        <div
          v-if="page.secondaryContent"
          class="text-gray-500 col-start-2 col-span-8 italic text-xs"
        >
          {{ page.secondaryContent }}
        </div>

        <div
          v-if="page.featuresList?.length"
          class="col-start-2 col-span-8"
        >
          <!-- TODO: Eagle-eye paywall -->
        </div>
      </div>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import AppPageWrapper from '@/shared/layout/page-wrapper.vue'
import { defineProps, computed } from 'vue'

const props = defineProps({
  module: {
    type: String,
    required: true
  }
})

const page = computed(() => pageContent[props.module])

const pageContent = {
  organizations: {
    icon: 'ri-community-line',
    headerTitle: 'Organizations',
    title:
      'Get a pulse of the organizations represented in your community',
    mainContent:
      'Get a complete organization directory that you can search, filter, and sort instantly. Each organization also has its own profile page, which highlights key information about that organization and all the community members that belong to it. Keeping a pulse of which organizations your members are representing is extremely important for a successful bottom-up growth strategy.',
    imageSrc: '/images/organizations-paywall.png',
    secondaryContent:
      'Organizations are companies or entities within your community. If a member that works at a certain company joins your community, that company will be added as an organization.',
    featuresList: []
  },
  // TODO: Eagle Eye paywall
  'eagle-eye': {}
}
</script>

<style lang="scss">
.paywall-page {
  .bg-image {
    @apply col-start-1 col-span-10 rounded-md h-96 overflow-hidden;
    background: linear-gradient(
        279.88deg,
        rgba(233, 79, 46, 0.05) 0%,
        rgba(233, 79, 46, 0) 100%
      ),
      #f9fafb;
  }
}
</style>
