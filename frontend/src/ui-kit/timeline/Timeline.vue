<template>
  <div
    v-for="group in props.groups"
    :key="group.label"
    class="c-timeline"
    @mouseover="emit('onGroupHover', group)"
    @mouseleave="emit('onGroupHover', null)"
  >
    <div class="c-timeline__group-icon">
      <lf-avatar
        :name="group.label"
        :src="group.icon"
        :size="24"
        class="!rounded-md border border-gray-200 min-w-6"
        img-class="!object-contain"
      />
    </div>
    <div class="grow">
      <div class="c-timeline__group-label">
        <router-link
          v-if="group.labelLink"
          :to="group.labelLink"
          class="cursor-pointer text-gray-900 hover:text-primary-500"
        >
          {{ group.label }}
        </router-link>
        <span v-else>
          {{ group.label }}
        </span>
      </div>

      <div class="c-timeline__items">
        <slot name="default" :group="group" :hovered="hovered" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { ref } from 'vue';
import { TimelineGroup } from './types/TimelineTypes';

const emit = defineEmits(['onGroupHover']);

const props = defineProps<{
  groups: TimelineGroup[];
}>();

const hovered = ref(false);

</script>

<script lang="ts">
export default {
  name: 'LfTimeline',
};
</script>

<style scoped lang="scss" src="./timeline.scss" />
