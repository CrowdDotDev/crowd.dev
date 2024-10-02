<template>
  <el-tooltip
    :hide-after="50"
    effect="dark"
    placement="right"
    raw-content
    :content="props.title"
    :disabled="!props.isCollapsed"
  >
    <component
      :is="props.disabled ? 'span' : 'router-link'"
      :to="props.to"
      v-bind="$attrs"
      class="l-menu__link"
      active-class="is-active"
      :class="{ 'is-disabled': props.disabled }"
    >
      <lf-icon-old :name="props.icon" :size="16" />
      <span class="transition" :class="!props.isCollapsed ? 'opacity-100' : 'opacity-0'">
        {{ props.title }}
      </span>
    </component>
  </el-tooltip>
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';

const props = defineProps<{
  isCollapsed: boolean;
  to: any,
  icon: string,
  title: string,
  disabled?: boolean,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfMenuLink',
};
</script>
