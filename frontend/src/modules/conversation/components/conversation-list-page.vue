<template>
  <app-page-wrapper>
    <div class="mb-10">
      <div class="flex items-center justify-between">
        <h4>Community Help Center</h4>
        <div class="flex items-center">
          <app-conversation-settings
            :visible="hasConversationsSettingsVisible"
            class="mr-2"
            @open="doOpenSettingsModal"
            @close="doCloseSettingsModal"
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
    <app-conversation-list-filter></app-conversation-list-filter>
    <app-conversation-list-table />
  </app-page-wrapper>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import ConversationListTable from '@/modules/conversation/components/conversation-list-table.vue'
import ConversationListFilter from '@/modules/conversation/components/conversation-list-filter.vue'
import ConversationSettings from '@/modules/conversation/components/conversation-settings.vue'
import config from '@/config'

export default {
  name: 'AppConversationListPage',

  components: {
    AppPageWrapper,
    'app-conversation-list-table': ConversationListTable,
    'app-conversation-list-filter': ConversationListFilter,
    'app-conversation-settings': ConversationSettings
  },

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      hasConversationsConfigured:
        'conversation/isConfigured',
      hasConversationsSettingsVisible:
        'conversation/hasSettingsVisible'
    }),
    computedCrowdOpenLink() {
      return `${config.conversationPublicUrl}/${this.currentTenant.url}`
    }
  },

  async mounted() {
    window.analytics.page('Conversations')
  },

  methods: {
    ...mapActions({
      doOpenSettingsModal:
        'conversation/doOpenSettingsModal',
      doCloseSettingsModal:
        'conversation/doCloseSettingsModal'
    })
  }
}
</script>

<style></style>
