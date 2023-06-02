<template>
  <div style="display: flex">
    <component
      :is="customComponent"
      :class="`member-display-name ${customClass}`"
      :to="
        withLink
          ? {
              name: 'memberView',
              params: { id: member.id },
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
import { defineProps } from "vue";
import AppMemberBadge from "@/modules/member/components/member-badge.vue";

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

const customComponent = props.withLink ? "router-link" : "span";
</script>

<script>
export default {
  name: "AppMemberDisplayName",
};
</script>
