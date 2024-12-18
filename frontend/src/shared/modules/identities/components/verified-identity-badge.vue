<template>
  <!-- Once we implement our own popover component, we should use the lf-tooltip instead of <el-tooltip>
  Currently, the lf-tooltip is not working as expected, due to z-index issues.
  -->
  <el-tooltip placement="top" popper-class="!bg-gray-900 !py-1">
    <template #content>
      <span class="text-2xs flex flex-col text-center max-w-55">
        <span class="font-semibold text-white">
          Verified identity
        </span>
        <span class="text-gray-300">
          Identities from connected integrations are automatically verified.
        </span>
      </span>
    </template>

    <lf-icon-old
      name="verified-badge-line"
      :size="16"
      class="ml-1 text-primary-500"
    />
  </el-tooltip>
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
</script>
