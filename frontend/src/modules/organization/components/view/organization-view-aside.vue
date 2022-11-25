<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-black">Identities</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewAside'
}
</script>

<script setup>
import { defineProps } from 'vue'

defineProps({
  organization: {
    type: Object,
    default: () => {}
  }
})
</script>
