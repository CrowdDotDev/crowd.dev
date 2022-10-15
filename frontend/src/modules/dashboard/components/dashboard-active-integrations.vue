<template>
  <div class="flex items-center justify-end -ml-1">
    <!-- List of integrations -->
    <div
      v-for="active of Object.keys(activeIntegrations)"
      :key="active"
      class="m-1"
    >
      <el-tooltip
        effect="dark"
        :content="platformDetails(active).name"
        placement="top"
      >
        <div
          class="w-8 h-8 rounded-full border flex items-center justify-center"
          :style="{
            background: platformDetails(active).color,
            'border-color':
              platformDetails(active).borderColor
          }"
        >
          <img
            class="w-4 h-4"
            :src="platformDetails(active).image"
            :alt="platformDetails(active).name"
          />
        </div>
      </el-tooltip>
    </div>

    <!-- button linking to add new integrations -->
    <el-tooltip
      effect="dark"
      content="Add integrations"
      placement="top"
    >
      <router-link
        :to="{ name: 'settings' }"
        class="w-8 h-8 m-1 rounded-full border border-gray-400 hover:bg-brand-50 hover:border-brand-500 transition group border-dashed flex items-center justify-center"
        route
      >
        <i
          class="ri-add-line text-lg text-gray-400 group-hover:text-brand-500"
        ></i>
      </router-link>
    </el-tooltip>
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
