<template>
  <app-reddit-connect-drawer
    v-if="hasSettings && drawerVisible"
    v-model="drawerVisible"
    :subreddits="subreddits"
    :connect-url="''"
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
import { useStore } from 'vuex'
import Pizzly from '@nangohq/pizzly-frontend'
import { useRouter, useRoute } from 'vue-router'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import Message from '@/shared/message/message'
import AppRedditConnectDrawer from '@/integrations/reddit/components/reddit-connect-drawer'
import config from '@/config'

const store = useStore()
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

const tenantId = computed(() => AuthCurrentTenant.get())
const subreddits = computed(
  () => props.integration.subreddits
)

async function connect() {
  const pizzly = new Pizzly(config.pizzlyUrl)
  await pizzly.auth('reddit', `${tenantId.value}-reddit`)
  await store.dispatch('integration/doRedditOnboard', {
    subreddits: ['python']
  })
}

const settings = () => {
  drawerVisible.value = true
}
</script>
