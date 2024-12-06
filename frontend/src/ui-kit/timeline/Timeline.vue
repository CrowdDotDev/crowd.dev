<template>
  <div class="c-timeline" v-for="group in props.groups" :key="group.label">
    <div class="c-timeline__group-icon">
      <lf-avatar
        :name="group.label"
        :src="group.icon"
        :size="24"
        class="!rounded-md border border-gray-200 min-w-6"
        img-class="!object-contain"
      />
    </div>
    <div>
      <div class="c-timeline__group-label">
        <router-link
        v-if="group.labelLink"
        :to="group.labelLink"
          class="cursor-pointer"
        >
          {{ group.label }}
        </router-link>
        <span v-else>
          {{ group.label }}
        </span>
      </div>

      <div class="c-timeline__items">
        <slot name="default" :group="group" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TimelineGroup } from './types/TimelineTypes';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';

const props = defineProps<{
  groups: TimelineGroup[];
}>();

</script>

<script lang="ts">
export default {
  name: 'LfTimeline',
};
</script>

<style scoped lang="scss" src="./timeline.scss" />
