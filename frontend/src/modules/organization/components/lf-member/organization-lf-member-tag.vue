<template>
  <el-tooltip v-if="!!organization.lfxMembership" :disabled="!onlyShowIcon" content="LF Member" placement="top">
    <div class="text-primary-500 flex items-center gap-1">
      <i :class="`ri-star-s-fill ${iconFontSize}`" />
      <span v-if="!onlyShowIcon" class="font-semibold text-xs">LF Member</span>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { Organization } from '../../types/Organization';

withDefaults(
  defineProps<{
    organization: Organization;
    onlyShowIcon?: boolean;
    iconFontSize?: 'text-sm' | 'text-base';
  }>(),
  {
    onlyShowIcon: false,
    iconFontSize: 'text-sm',
  },
);
</script>
