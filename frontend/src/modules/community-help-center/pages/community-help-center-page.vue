<template>
  <app-page-wrapper>
    <div class="mb-10">
      <div class="flex items-center justify-between">
        <h4>Community Help Center</h4>
        <div class="flex items-center">
          <app-community-help-center-settings
            class="mr-2"
            :visible="hasSettingsVisible"
            @open="doOpenSettingsDrawer"
            @close="doCloseSettingsDrawer"
          />
          <a
            :href="computedCrowdOpenLink"
            target="_blank"
            class="btn btn-brand--secondary btn--md"
            ><i class="ri-external-link-line mr-2"></i>Open
            public page</a
          >
        </div>
      </div>
      <div class="text-xs text-gray-500">
        Overview of all members from your community
      </div>
    </div>
    <app-community-help-center-tabs />
    <app-community-help-center-filter />
    <app-community-help-center-table />
  </app-page-wrapper>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppCommunityHelpCenterTable from '@/modules/community-help-center/components/community-help-center-table'
import AppCommunityHelpCenterTabs from '@/modules/community-help-center/components/community-help-center-tabs'
import AppCommunityHelpCenterFilter from '@/modules/community-help-center/components/community-help-center-filter'
import AppCommunityHelpCenterSettings from '@/modules/community-help-center/components/community-help-center-settings'
import config from '@/config'

export default {
  name: 'AppConversationListPage',

  components: {
    AppPageWrapper,
    AppCommunityHelpCenterTable,
    AppCommunityHelpCenterTabs,
    AppCommunityHelpCenterFilter,
    AppCommunityHelpCenterSettings
  },

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      isConfigured: 'communityHelpCenter/isConfigured',
      hasSettingsVisible:
        'communityHelpCenter/hasSettingsVisible'
    }),
    computedCrowdOpenLink() {
      return `${config.conversationPublicUrl}/${this.currentTenant.url}`
    }
  },

  async mounted() {
    window.analytics.page('Community Help Center')
  },

  methods: {
    ...mapActions({
      doOpenSettingsDrawer:
        'communityHelpCenter/doOpenSettingsDrawer',
      doCloseSettingsDrawer:
        'communityHelpCenter/doCloseSettingsDrawer'
    })
  }
}
</script>

<style></style>
