<template>
  <div class="flex flex-wrap">
    <component
      :is="customComponent"
      :class="`member-display-name ${customClass}`"
      :to="
        withLink
          ? {
            name: 'memberView',
            params: { id: member.id },
            query: { projectGroup: selectedProjectGroup?.id },
          }
          : null
      "
    >
      <span v-html="$sanitize(member.displayName)" />
    </component>
    <app-member-badge v-if="showBadge" :member="member" />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import AppMemberBadge from '@/modules/member/components/member-badge.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
  showBadge: {
    type: Boolean,
    required: false,
    default: true,
  },
  withLink: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: null,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const customComponent = props.withLink ? 'router-link' : 'span';
</script>

<script>
export default {
  name: 'AppMemberDisplayName',
};
</script>
