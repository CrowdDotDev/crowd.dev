<template>
  <div>
    <component
      :is="customComponent"
      :class="`member-display-name ${customClass}`"
      :to="
        withLink
          ? {
              name: 'memberView',
              params: { id: member.id }
            }
          : null
      "
    >
      {{ member.displayName }}
    </component>
    <app-member-badge :member="member" />
  </div>
</template>

<script>
export default {
  name: 'AppMemberDisplayName'
}
</script>
<script setup>
import AppMemberBadge from '@/modules/member/components/member-badge'
import { defineProps } from 'vue'

const props = defineProps({
  member: {
    type: Object,
    default: () => {}
  },
  withLink: {
    type: Boolean,
    default: false
  },
  customClass: {
    type: String,
    default: null
  }
})

const customComponent = props.withLink
  ? 'router-link'
  : 'span'
</script>
