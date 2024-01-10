<template>
  <div
    class="h-14 flex items-center transition group pl-4 pr-4"
  >
    <router-link to="/" class="w-8 flex justify-center">
      <div>
        <img
          key="logo"
          class="h-6 !opacity-100"
          src="/images/logo/crowd-mini.svg"
          alt="crowd.dev logo"
        />
      </div>
    </router-link>
    <el-button
      class="absolute btn btn--icon--sm btn--transparent !h-8 w-8 flex items-center
      toggle-menu-button transition !bg-white !text-gray-300 hover:!bg-gray-100 hover:!text-black z-10 right-4 !border-0"
      @click="emit('toggle-menu')"
    >
      <i
        class="text-lg leading-none "
        :class="props.collapsed ? 'ri-layout-left-line' : 'ri-layout-left-2-line'"
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
