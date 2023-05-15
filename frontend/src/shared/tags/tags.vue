<template>
  <el-tooltip
    v-for="tag of visibleTags
      || []"
    :key="tag"
    :disabled="!tag"
    placement="top"
  >
    <template #content>
      <slot name="tagTooltipContent" />
    </template>
    <div class="badge--interactive !block" @click.prevent>
      {{ tag }}
    </div>
  </el-tooltip>
  <el-popover
    placement="top"
    :width="250"
    trigger="hover"
    :disabled="!collapseTagsTooltip"
  >
    <template #reference>
      <div v-if="hiddenTags.length" class="badge--border">
        +{{ hiddenTags.length }}
      </div>
    </template>
    <template #default>
      <div class="flex flex-wrap gap-1">
        <a
          v-for="hiddenTag in hiddenTags"
          :key="hiddenTag"
          class="badge--border"
          :href="hiddenTag"
          @click.prevent
        >
          {{ hiddenTag }}
        </a>
      </div>
    </template>
  </el-popover>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  collapseTags: {
    type: Boolean,
    default: false,
  },
  collapseTagsTooltip: {
    type: Boolean,
    default: false,
  },
  maximumVisibleTags: {
    type: Number,
    default: 2,
  },
});

const visibleTags = computed(() => {
  if (!props.collapseTags) {
    return props.tags;
  }

  if (props.maximumVisibleTags < props.tags.length) {
    return [...props.tags].splice(props.maximumVisibleTags + 1);
  }

  return props.tags;
});

const hiddenTags = computed(() => {
  if (!props.collapseTags) {
    return [];
  }

  if (props.maximumVisibleTags < props.tags.length) {
    return [...props.tags].splice(0, props.maximumVisibleTags + 1);
  }

  return props.tags;
});
</script>

<script>
export default {
  name: 'AppTags',
};
</script>
