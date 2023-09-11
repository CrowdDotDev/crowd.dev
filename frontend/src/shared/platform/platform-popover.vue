<template>
  <el-popover
    v-if="usernameHandles.length > 1"
    placement="top"
    popper-class="platform-popover"
    :width="240"
    trigger="hover"
  >
    <template #reference>
      <div>
        <slot name="platform" />
      </div>
    </template>

    <app-platform-list
      :username-handles="usernameHandles"
      :platform="platform"
      :links="links"
    />
  </el-popover>
  <el-tooltip
    v-else
    :disabled="!tooltipLabel"
    popper-class="custom-identity-tooltip"
    placement="top"
  >
    <template #content>
      <span>{{ tooltipLabel }}
        <i
          v-if="href"
          class="ri-external-link-line text-gray-400"
        /></span>
    </template>

    <slot name="platform" />
  </el-tooltip>
</template>

<script setup>
import AppPlatformList from './platform-list.vue';

defineProps({
  usernameHandles: {
    type: Array,
    default: () => [],
  },
  links: {
    type: Array,
    default: () => [],
  },
  platform: {
    type: String,
    default: () => null,
  },
  tooltipLabel: {
    type: String,
    default: () => null,
  },
  href: {
    type: String,
    default: () => null,
  },
});
</script>

<script>
export default {
  name: 'AppPlatformPopover',
};
</script>

<style lang="scss">
.el-popover.el-popper.platform-popover {
    @apply px-0 py-2 shadow rounded-lg;
}
</style>
