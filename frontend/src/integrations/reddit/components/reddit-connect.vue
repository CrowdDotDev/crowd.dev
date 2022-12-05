<template>
  <app-reddit-connect-drawer
    v-if="hasSettings && drawerVisible"
    v-model="drawerVisible"
    :hashtags="hashtags"
    :connect-url="connectUrl"
  />
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="hasSettings"
  />
</template>

<script>
export default {
  name: 'AppRedditConnect'
}
</script>
<script setup>
import { defineProps, computed, ref, onMounted } from 'vue'
// import Pizzly from '@nangohq/pizzly-frontend'
import { useRouter, useRoute } from 'vue-router'
import Message from '@/shared/message/message'
import AppRedditConnectDrawer from '@/integrations/reddit/components/reddit-connect-drawer'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
const drawerVisible = ref(false)

onMounted(() => {
  const isConnectionSuccessful = route.query.success

  if (isConnectionSuccessful) {
    router.replace({ query: null })
    Message.success('Integration updated successfuly')
  }
})

// Only render reddit drawer and settings button, if integration has settings
const hasSettings = computed(
  () => !!props.integration.settings
)
const hashtags = computed(
  () => props.integration.settings?.hashtags || []
)

// Create an url for the connection without the hashtags
// This will allow to be reused by the reddit drawer component
// and override the current configured hashtag
const connectUrl = computed(() => {
  return ''
})

const connect = () => {
  // const pizzly = new Pizzly('http://localhost:3004')
  // // Add the already configured hashtags to the connectUrl
  // pizzly
  //   .auth('reddit', 'tenantId-reddit')
  //   .then((result) => {
  //     console.log(
  //       `OAuth flow succeeded for provider "${result.providerConfigKey}" and connection-id "${result.connectionId}"!`
  //     )
  //   })
  //   .catch((error) => {
  //     console.error(
  //       `There was an error in the OAuth flow for integration "${error.providerConfigKey}" and connection-id "${error.connectionId}": ${error.error.type} - ${error.error.message}`
  //     )
  //   })
}

const settings = () => {
  drawerVisible.value = true
}
</script>
