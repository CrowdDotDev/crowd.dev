<template>
  <div class="flex items-center -ml-1">
    <div
      v-for="active of Object.keys(activeIntegrations)"
      :key="active"
      class="w-8 h-8 m-1 rounded-full flex items-center justify-center"
      :style="{ background: platformDetails(active).color }"
    >
      <img
        class="w-4 h-4"
        :src="platformDetails(active).image"
        :alt="platformDetails(active).name"
      />
    </div>
    <router-link
      :to="{ name: 'settings' }"
      class="w-8 h-8 m-1 rounded-full border border-gray-400 border-dashed flex items-center justify-center"
      route
    >
      <i class="ri-add-line text-lg text-gray-400"></i>
    </router-link>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'AppDashboardIntegrations',
  computed: {
    ...mapGetters('integration', {
      activeIntegrations: 'activeList'
    })
  },
  async mounted() {
    window.analytics.page('Dashboard')
  },
  async created() {
    await this.fetchIntegrations()
  },
  methods: {
    ...mapActions('integration', {
      fetchIntegrations: 'doFetch'
    }),
    platformDetails(platform) {
      return integrationsJsonArray.find(
        (i) => i.platform === platform
      )
    }
  }
}
</script>
