<template>
  <app-integration-list-item
    :integration="integration"
    :onboard="onboard"
  >
    <template #connect>
      <el-button
        class="btn btn--secondary btn--md"
        :href="connectUrl"
        >Connect</el-button
      >
    </template>
  </app-integration-list-item>
</template>

<script>
export default {
  name: 'AppIntegrationDiscord'
}
</script>
<script setup>
import AppIntegrationListItem from '../integration-list-item'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { defineProps, computed, onMounted } from 'vue'
import config from '@/config'

const store = useStore()
const router = useRouter()

defineProps({
  integration: {
    type: Object,
    default: () => {}
  },
  onboard: {
    type: Boolean,
    default: false
  }
})

const connectUrl = computed(() => {
  return config.discordInstallationUrl
})

onMounted(async () => {
  const guildId = router.currentRoute.query?.guild_id
  if (guildId) {
    await store.dispatch('integration/doDiscordConnect', {
      guildId
    })
  }
})
</script>
