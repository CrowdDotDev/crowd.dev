<template>
  <slot :connect="connect"></slot>
</template>
<script>
export default {
  name: 'AppIntegrationLinkedin'
}
</script>
<script setup>
import { computed, defineProps } from 'vue'
import config from '@/config'
import Pizzly from '@nangohq/pizzly-frontend'
import { useStore } from 'vuex'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { useThrottleFn } from '@vueuse/core'

const store = useStore()
const tenantId = computed(() => AuthCurrentTenant.get())

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})

const callOnboard = useThrottleFn(async () => {
  await store.dispatch('integration/doLinkedinOnboard')
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
</script>
