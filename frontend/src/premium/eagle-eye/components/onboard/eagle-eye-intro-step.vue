<template>
  <h5>{{ pageContent.eagleEye.title }}</h5>

  <div class="text-xs text-gray-600 mt-6">
    {{ pageContent.eagleEye.mainContent }}
  </div>

  <div class="flex flex-col gap-5 mt-6 mb-16">
    <div
      v-for="(feature, index) of pageContent.eagleEye
        .featuresList"
      :key="index"
      class="flex items-center"
    >
      <i
        class="text-brand-500 text-lg"
        :class="feature.icon"
      />
      <div class="ml-4 text-xs">
        {{ feature.title }}
      </div>
    </div>
  </div>

  <el-button
    class="btn btn--primary btn--full btn--md"
    @click="emit('onStepChange', 1)"
  >
    Set up your feed
  </el-button>
  <a
    href="https://docs.crowd.dev/docs/eagle-eye"
    target="_blank"
    rel="noopener noreferrer"
    class="btn btn--secondary btn--full btn--md mt-5 hover:!text-gray-600"
  ><i class="ri-book-open-line" /><span>Read more</span></a>
</template>

<script setup>
import { defineEmits } from 'vue';
import { pageContent } from '@/modules/layout/layout-page-content';

const emit = defineEmits(['onStepChange']);
</script>
