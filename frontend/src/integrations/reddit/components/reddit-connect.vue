<template>
  <slot :connect="connect" />
  <app-reddit-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script>
export default {
  name: 'AppRedditConnect'
}
</script>
<script setup>
import { defineProps, ref } from 'vue'
import AppRedditConnectDrawer from '@/integrations/reddit/components/reddit-connect-drawer'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
const drawerVisible = ref(false)

async function connect() {
  drawerVisible.value = true
}
</script>
