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
      <lf-icon :name="feature.icon" class="text-primary-500" :size="20" />
      <div class="ml-4 text-xs">
        {{ feature.title }}
      </div>
    </div>
  </div>

  <lf-button
    v-if="hasPermission(LfPermission.eagleEyeCreate)"
    type="primary"
    size="medium"
    class="w-full"
    @click="emit('onStepChange', 1)"
  >
    Set up your feed
  </lf-button>
  <a
    href="https://docs.crowd.dev/docs/eagle-eye"
    target="_blank"
    rel="noopener noreferrer"
    class="c-btn c-btn--secondary-gray w-full c-btn--medium mt-5 hover:!text-gray-600"
  ><lf-icon name="book-open" :size="16" /><span>Read more</span></a>
</template>

<script setup>
import { defineEmits } from 'vue';
import { pageContent } from '@/modules/layout/layout-page-content';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const emit = defineEmits(['onStepChange']);

const { hasPermission } = usePermissions();
</script>
