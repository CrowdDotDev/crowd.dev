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
  name: 'AppLinkedInConnect'
}
</script>
<script setup>
import { computed, defineProps, ref } from 'vue'
import AppLinkedinSettingsDrawer from '@/integrations/linkedin/components/linkedin-settings-drawer'
import config from '@/config'
import Pizzly from '@nangohq/pizzly-frontend'
import { useStore } from 'vuex'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { useThrottleFn } from '@vueuse/core'

const store = useStore()
const props = defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})

const tenantId = computed(() => AuthCurrentTenant.get())

const callOnboard = useThrottleFn(async () => {
  await store.dispatch('integration/doLinkedinConnect')
}, 2000)

const connect = async () => {
  const pizzly = new Pizzly(
    config.pizzlyUrl,
    config.pizzlyPublishableKey
  )

  try {
    await pizzly.auth(
      'linkedin',
      `${tenantId.value}-linkedin`
    )
    await callOnboard()
  } catch (e) {
    console.log(e)
  }
}

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
</script>
