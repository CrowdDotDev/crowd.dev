<template>
  <slot
    :connect="isLinkedinEnabled ? connect : upgradePlan"
    :settings="settings"
    :has-settings="hasSettings"
    :has-integration="isLinkedinEnabled"
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
import { useRouter } from 'vue-router'
import AppLinkedinSettingsDrawer from '@/integrations/linkedin/components/linkedin-settings-drawer'
import config from '@/config'
import Nango from '@nangohq/frontend'
import { useStore } from 'vuex'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { useThrottleFn } from '@vueuse/core'
import { FeatureFlag } from '@/featureFlag'

const store = useStore()
const router = useRouter()
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
  const nango = new Nango({ host: config.nangoUrl })

  try {
    await nango.auth(
      'linkedin',
      `${tenantId.value}-linkedin`
    )
    await callOnboard()
  } catch (e) {
    console.log(e)
  }
}

const upgradePlan = () => {
  router.push('/settings?activeTab=plans')
}

const drawerVisible = ref(false)
const isLinkedinEnabled = ref(false)

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
  isLinkedinEnabled.value = FeatureFlag.isFlagEnabled(
    FeatureFlag.flags.linkedin
  )
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
