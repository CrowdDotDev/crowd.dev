<template>
  <div class="community-member-list-page">
    <div
      v-if="widgetsLoading"
      v-loading="widgetsLoading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <h1 class="app-content-title">Discover Members</h1>
      <div
        class="border p-4 mb-4 rounded-lg border-secondary-900 bg-secondary-50"
      >
        <div class="flex items-start">
          <i
            class="ri-information-fill mr-4 ri-xl flex items-center pt-1 text-secondary-900"
          ></i>
          <div class="text-sm">
            <div class="font-semibold mb-1">
              Lookalike Members
            </div>
            <div>
              We analyzed your current community and current
              repositories added to the benchmark widget, to
              find lookalike members on
              <span class="font-semibold">GitHub</span>.
              <br />The lookalike score tries to estimate
              how likely they are to join your community.
              You can use the list to, for example, do
              outreach or create a Twitter ads campaign.
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end items-center mb-4">
        <div
          id="teleport-community-member-filter-toggle"
        ></div>
      </div>
      <app-community-member-list-filter
        :lookalike="true"
      ></app-community-member-list-filter>
      <div class="relative">
        <div
          v-if="
            !githubIntegration ||
            !benchmarkWidget ||
            !benchmarkWidget.settings ||
            benchmarkWidget.settings.repositories.length ===
              0
          "
          class="absolute flex items-center justify-center flex-grow w-full inset-0 z-10 rounded-lg blur-2xl"
          :style="{
            backgroundColor: 'rgba(255,255,255,0.95)'
          }"
        >
          <div
            v-if="!githubIntegration"
            class="text-center"
          >
            <router-link
              class="btn btn--primary"
              :to="{
                name: 'settings',
                query: { activeTab: 'integrations' }
              }"
            >
              Set GitHub Integration
            </router-link>
            <div class="text-gray-600 mt-4">
              To discover lookalike members, please set up
              <br />
              the
              <span class="font-semibold">GitHub</span>
              integration first.
            </div>
          </div>
          <div v-else class="text-center">
            <router-link
              class="btn btn--primary"
              :to="{
                name: 'dashboard'
              }"
            >
              Set Benchmark Widget
            </router-link>
            <div class="text-gray-600 mt-4">
              To discover lookalike members, please set up
              <br />
              the dashboard
              <span class="font-semibold">Benchmark</span>
              widget first.
            </div>
          </div>
        </div>
        <app-community-member-list-table
          :lookalike="true"
        ></app-community-member-list-table>
      </div>
    </div>
  </div>
</template>

<script>
import CommunityMemberListFilter from '@/modules/community-member/components/community-member-list-filter.vue'
import CommunityMemberListTable from '@/modules/community-member/components/community-member-list-table.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppCommunityMemberListPage',

  components: {
    'app-community-member-list-filter': CommunityMemberListFilter,
    'app-community-member-list-table': CommunityMemberListTable
  },

  computed: {
    ...mapGetters({
      filter: 'communityMember/list/filter',
      rawFilter: 'communityMember/list/rawFilter',
      integrations: 'integration/listByPlatform',
      integrationsCount: 'integration/count',
      widgetFindByType: 'widget/findByType',
      widgetsCount: 'widget/count',
      widgetsLoading: 'widget/loadingFetch'
    }),
    githubIntegration() {
      return this.integrations.github
    },
    benchmarkWidget() {
      return this.widgetFindByType('benchmark')
    }
  },

  async created() {
    await this.doResetFilter()
    if (this.widgetsCount === 0) {
      this.doFetchWidgets()
    }
    if (this.integrationsCount === 0) {
      this.doFetchIntegrations()
    }
  },

  async mounted() {
    window.analytics.page('Lookalike')
  },

  methods: {
    ...mapActions({
      doFetch: 'communityMember/list/doFetch',
      doFindLookalike:
        'communityMember/list/doFindLookalike',
      doResetFilter: 'communityMember/list/doReset',
      doFetchWidgets: 'widget/doFetch',
      doFetchIntegrations: 'integration/doFetch'
    })
  }
}
</script>
