<template>
  <div
    class="flex flex-col items-center justify-center pt-20 pb-10"
  >
    <i class="empty-list-icon mb-8" :class="icon" />

    <h5>{{ title }}</h5>
    <div
      v-if="description"
      class="text-gray-600 text-sm mt-4 w-6/12 text-center"
    >
      <i
        v-if="hasWarningIcon"
        class="ri-information-line text-brand-500 text-base mr-2"
      />
      <span v-html="description" />
    </div>
    <div class="flex gap-6 mt-8">
      <el-button
        v-if="ctaBtn"
        class="btn btn--primary btn--md"
        @click="emit('ctaClick')"
      >
        {{ ctaBtn }}
      </el-button>
      <el-button
        v-if="secondaryBtn"
        class="btn btn--secondary btn--md"
        @click="emit('secondaryClick')"
      >
        {{ secondaryBtn }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const emit = defineEmits(['ctaClick', 'secondaryClick']);
defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: () => null,
  },
  ctaBtn: {
    type: String,
    default: () => null,
  },
  secondaryBtn: {
    type: String,
    default: () => null,
  },
  hasWarningIcon: {
    type: Boolean,
    default: () => false,
  },
});
</script>

<style lang="scss">
.empty-list-icon {
  font-size: 160px;
  @apply leading-none text-gray-200;
}
</style>
