<template>
  <div v-if="isVisible" class="flex grow justify-center pt-4">
    <div
      v-if="isLoading"
      v-loading="isLoading"
      class="app-page-spinner h-16 w-16 !relative !min-h-fit"
    />
    <el-button v-else class="btn btn-link btn-link--primary" @click="fetchFn">
      <i class="ri-arrow-down-line" />
      <span class="text-xs">Load more</span>
    </el-button>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  isVisible: boolean;
  isLoading: boolean;
  fetchFn: void;
}>();
</script>
