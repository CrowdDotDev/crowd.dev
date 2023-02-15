<template>
  <section>
    <h6 class="text-base leading-6 font-semibold pb-3">
      Integrations
    </h6>
    <article
      v-for="(active, ai) of Object.keys(
        activeIntegrations
      )"
      :key="active"
      class="border-gray-100 py-3 flex items-center justify-between"
      :class="{ 'border-t': ai > 0 }"
    >
      <div class="flex items-center">
        <div class="mr-4">
          <img
            class="w-5 h-5"
            :src="platformDetails(active).image"
            :alt="platformDetails(active).name"
          />
        </div>
        <p class="text-xs leading-4">
          {{ platformDetails(active).name }}
        </p>
      </div>
      <div></div>
    </article>

    <!--    &lt;!&ndash; button linking to add new integrations &ndash;&gt;-->
    <!--    <el-tooltip-->
    <!--      effect="dark"-->
    <!--      content="Add integrations"-->
    <!--      placement="top"-->
    <!--    >-->
    <!--      <router-link-->
    <!--        :to="{ name: 'integration' }"-->
    <!--        class="w-8 h-8 m-1 rounded-full border border-gray-400 hover:bg-brand-50 hover:border-brand-500 transition group border-dashed flex items-center justify-center"-->
    <!--        route-->
    <!--      >-->
    <!--        <i-->
    <!--          class="ri-add-line text-lg text-gray-400 group-hover:text-brand-500"-->
    <!--        ></i>-->
    <!--      </router-link>-->
    <!--    </el-tooltip>-->
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { CrowdIntegrations } from '@/integrations/integrations-config'

export default {
  name: 'AppDashboardIntegrations',
  data() {
    return {
      storeUnsubscribe: () => {}
    }
  },
  computed: {
    ...mapGetters('integration', {
      activeIntegrations: 'activeList'
    })
  },
  async mounted() {
    window.analytics.page('Dashboard')
    await this.fetchIntegrations()
    this.storeUnsubscribe =
      await this.$store.subscribeAction(async (action) => {
        if (action.type === 'auth/doRefreshCurrentUser') {
          await this.fetchIntegrations()
        }
      })
  },
  beforeUnmount() {
    this.storeUnsubscribe()
  },
  methods: {
    ...mapActions('integration', {
      fetchIntegrations: 'doFetch'
    }),
    platformDetails(platform) {
      return CrowdIntegrations.getMappedConfig(
        platform,
        this.$store
      )
    }
  }
}
</script>
