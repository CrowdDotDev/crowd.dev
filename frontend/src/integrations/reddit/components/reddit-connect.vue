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
import { useStore } from 'vuex'
import { defineProps, computed, ref, onMounted } from 'vue'
import config from '@/config'
import { AuthToken } from '@/modules/auth/auth-token'
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
const store = useStore()
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
  // TODO: Call Pizzly
})

const connect = () => {
  // Add the already configured hashtags to the connectUrl
  const encodedHashtags =
    hashtags.value.length > 0
      ? `&hashtags[]=${
          hashtags.value[hashtags.value.length - 1]
        }`
      : ''

  window.open(
    `${connectUrl.value}${encodedHashtags}`,
    '_self'
  )
}

const settings = () => {
  drawerVisible.value = true
}
</script>
