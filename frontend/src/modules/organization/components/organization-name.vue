<template>
  <div class="flex items-center gap-3">
    <div>
      <div
        class="min-h-8 min-w-8 w-8 h-8 border border-gray-200 rounded flex items-center justify-center overflow-hidden"
        :class="{
          'bg-white': organization.logo,
          'bg-gray-50': !organization.logo,
        }"
      >
        <img
          v-if="organization.logo"
          :src="organization.logo"
          alt="Logo"
          class="max-h-8"
        />
        <i
          v-else
          class="ri-community-line text-lg text-gray-300 h-5"
        />
      </div>
    </div>
    <div class="overflow-hidden mr-6">
      <el-tooltip
        :content="organization.displayName"
        effect="dark"
        placement="top"
        :disabled="!showTooltip"
      >
        <div
          ref="nameRef"
          class="font-semibold text-sm text-gray-900 overflow-hidden whitespace-nowrap text-ellipsis truncate"
          @mouseover="handleOnMouseOver"
          @mouseleave="handleOnMouseLeave"
        >
          {{ organization.displayName }}
        </div>
      </el-tooltip>
      <app-organization-badge
        class="mt-1"
        :organization="organization"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import AppOrganizationBadge from '@/modules/organization/components/organization-badge.vue';

defineProps({
  organization: {
    type: Object,
    default: () => null,
  },
});

const nameRef = ref();
const showTooltip = ref(false);

const handleOnMouseOver = () => {
  if (!nameRef.value) {
    showTooltip.value = false;
  }

  showTooltip.value = nameRef.value.scrollWidth > nameRef.value.clientWidth;
};

const handleOnMouseLeave = () => {
  showTooltip.value = false;
};
</script>

<script>
export default {
  name: 'AppOrganizationName',
};
</script>
