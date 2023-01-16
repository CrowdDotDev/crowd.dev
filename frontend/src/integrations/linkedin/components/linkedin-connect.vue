<template>
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="hasSettings"
  />
  <app-linkedin-settings-drawer
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
import { computed, defineProps, ref } from 'vue'
import AppLinkedinSettingsDrawer from '@/integrations/linkedin/components/linkedin-settings-drawer'

const props = defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
const drawerVisible = ref(false)

// Only render twitter drawer and settings button, if integration has settings
const hasSettings = computed(
  () =>
    !!props.integration.settings ||
    props.integration.status === 'error' ||
    true
)
const settings = () => {
  drawerVisible.value = true
}

async function connect() {
  drawerVisible.value = true
}
</script>
