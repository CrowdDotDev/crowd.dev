<template>
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="hasSettings"
    :connect-disabled="connectDisabled"
  />
  <app-linkedin-settings-drawer
    v-if="integration.status"
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
import {
  computed,
  defineProps,
  onMounted,
  ref,
  watch
} from 'vue'
import AppLinkedinSettingsDrawer from '@/integrations/linkedin/components/linkedin-settings-drawer'
import config from '@/config'
import Pizzly from '@nangohq/pizzly-frontend'
import { useStore } from 'vuex'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { useThrottleFn } from '@vueuse/core'
import {
  featureFlags,
  isFeatureEnabled
} from '@/utils/posthog'

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
const connectDisabled = ref(false)

// Only render linkedin drawer and settings button, if integration has settings and more than 1 organization
const hasSettings = computed(
  () =>
    !!props.integration.settings &&
    props.integration.settings.organizations.length > 1
)
const settings = () => {
  drawerVisible.value = true
}

onMounted(async () => {
  const hasLinkedinPermissions = await isFeatureEnabled(
    featureFlags.linkedin
  )
  connectDisabled.value = !hasLinkedinPermissions
})

watch(
  computed(() => props.integration.status),
  (newValue, oldValue) => {
    if (newValue === 'pending-action' && !oldValue) {
      drawerVisible.value = true
    }
  }
)
</script>
