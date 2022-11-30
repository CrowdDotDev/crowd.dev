<template>
  <slot :connect="connect" />
  <app-hackerNews-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script>
export default {
  name: 'AppHackerNewsConnect'
}
</script>
<script setup>
import { defineProps, ref } from 'vue'
import AppHackerNewsConnectDrawer from '@/integrations/hackernews/components/hackerNews-connect-drawer'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})

const connect = () => {
  drawerVisible.value = true
}

const drawerVisible = ref(false)
</script>
