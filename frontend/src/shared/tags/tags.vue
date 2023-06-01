<template>
  <el-tooltip
    v-for="tag of visibleTags
      || []"
    :key="tag"
    :disabled="!tag || !tagTooltipContent"
    placement="top"
  >
    <template #content>
      <slot name="tagTooltipContent" />
    </template>
    <a
      v-if="interactive"
      class="badge--interactive !block"
      :href="withHttp(tag)"
      target="_blank"
      rel="noopener noreferrer"
      @click.stop
    >
      {{ tag }}
    </a>
    <div
      v-else
      class="badge--border !block"
      :class="tagClass"
      @click.prevent
    >
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
      <div v-if="!!hiddenTags.length" class="badge--border">
        +{{ hiddenTags.length }}
      </div>
    </template>
    <template #default>
      <div class="flex flex-wrap gap-1 overflow-hidden">
        <div
          v-for="hiddenTag in hiddenTags"
          :key="hiddenTag"
          class="truncate"
        >
          <a
            v-if="interactive"
            class="badge--border !overflow-visible"
            :class="tagClass"
            target="_blank"
            rel="noopener noreferrer"
            :href="withHttp(hiddenTag)"
            @click.stop
          >
            {{ hiddenTag }}
          </a>
          <div v-else class="badge--border !block" :class="tagClass" @click.prevent>
            {{ hiddenTag }}
          </div>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup>
import { computed } from 'vue';
import { withHttp } from '@/utils/string';

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
  tagTooltipContent: {
    type: Boolean,
    default: false,
  },
  tagClass: {
    type: String,
    default: null,
  },
});

const visibleTags = computed(() => {
  if (!props.collapseTags) {
    return props.tags;
  }

  if (props.maximumVisibleTags < props.tags.length) {
    return [...props.tags].slice(0, props.maximumVisibleTags);
  }

  return props.tags;
});

const hiddenTags = computed(() => {
  if (!props.collapseTags) {
    return [];
  }

  if (props.maximumVisibleTags < props.tags.length) {
    return [...props.tags].slice(props.maximumVisibleTags);
  }

  return [];
});
</script>

<script>
export default {
  name: 'AppTags',
};
</script>
