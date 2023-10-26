<template>
  <div
    class="h-14 flex items-center transition group pl-5 pr-3"
  >
    <router-link to="/">
      <img
        key="logo"
        class="h-6 !opacity-100"
        src="/images/logo/crowd-mini.svg"
        alt="crowd.dev logo"
      />
    </router-link>
    <el-button
      class="absolute btn btn--icon--sm btn--transparent !h-8 w-8 flex items-center toggle-menu-button transition !bg-white hover:!bg-gray-100 z-10"
      :class="props.collapsed ? 'right-4' : 'right-3'"
      @click="emit('toggle-menu')"
    >
      <i
        class="ri-layout-left-2-line text-lg leading-none text-gray-300"
      />
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

const props = defineProps<{
  collapsed: boolean,
}>();

const emit = defineEmits<{(e: 'toggle-menu'): any}>();
</script>

<script lang="ts">
export default {
  name: 'CrMenuHeader',
};
</script>
