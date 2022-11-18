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
          <el-tooltip
            content="Activate the public page in Settings"
            placement="top"
            :disabled="isConfigured"
          >
            <div>
              <a
                :href="
                  isConfigured
                    ? computedCrowdOpenLink
                    : undefined
                "
                target="_blank"
                class="btn btn-brand--secondary btn--md"
                :class="{
                  disabled: !isConfigured
                }"
                ><i class="ri-external-link-line mr-2"></i
                >Open public page</a
              >
            </div>
          </el-tooltip>
        </div>
      </div>
      <div class="text-xs text-gray-500">
        Overview of all members from your community
      </div>
    </div>
    <app-community-help-center-tabs />
    <app-community-help-center-filter />
    <app-community-help-center-table
      @open-conversation-drawer="onConversationDrawerOpen"
    />

    <app-community-help-center-conversation-drawer
      :expanded="!!drawerConversationId"
      :conversation-id="drawerConversationId"
      @close="onConversationDrawerClose"
    ></app-community-help-center-conversation-drawer>
  </app-page-wrapper>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppCommunityHelpCenterTable from '@/premium/community-help-center/components/community-help-center-table'
import AppCommunityHelpCenterTabs from '@/premium/community-help-center/components/community-help-center-tabs'
import AppCommunityHelpCenterFilter from '@/premium/community-help-center/components/community-help-center-filter'
import AppCommunityHelpCenterSettings from '@/premium/community-help-center/components/community-help-center-settings'
import AppCommunityHelpCenterConversationDrawer from '@/premium/community-help-center/components/community-help-center-conversation-drawer'
import config from '@/config'

export default {
  name: 'AppConversationListPage',

  components: {
    AppPageWrapper,
    AppCommunityHelpCenterTable,
    AppCommunityHelpCenterTabs,
    AppCommunityHelpCenterFilter,
    AppCommunityHelpCenterSettings,
    AppCommunityHelpCenterConversationDrawer
  },

  data() {
    return {
      drawerConversationId: null
    }
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
    }),
    onConversationDrawerOpen(id) {
      this.drawerConversationId = id
    },
    onConversationDrawerClose() {
      this.drawerConversationId = null
    }
  }
}
</script>

<style></style>
