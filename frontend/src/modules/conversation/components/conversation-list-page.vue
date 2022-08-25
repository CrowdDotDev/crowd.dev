<template>
  <div>
    <div class="flex items-center">
      <h1 class="app-content-title">
        <app-i18n
          code="entities.conversation.name"
        ></app-i18n>
      </h1>

      <a
        :href="computedCrowdOpenLink"
        target="_blank"
        class="flex items-center mb-4 ml-4"
        >View Public Page<i
          class="ri-external-link-line ml-2"
        ></i
      ></a>
    </div>

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center">
        <app-conversation-published-tabs />
        <app-conversation-platform-tabs class="ml-4" />
      </div>
      <div class="flex items-center justify-end">
        <portal-target
          name="conversation-filter-toggle"
        ></portal-target>
        <app-conversation-settings
          :visible="hasConversationsSettingsVisible"
          @open="doOpenSettingsModal"
          @close="doCloseSettingsModal"
        />
      </div>
    </div>

    <app-conversation-list-filter></app-conversation-list-filter>
    <app-conversation-list-table />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ConversationListTable from '@/modules/conversation/components/conversation-list-table.vue'
import ConversationListFilter from '@/modules/conversation/components/conversation-list-filter.vue'
import ConversationPublishedTabs from '@/modules/conversation/components/conversation-published-tabs.vue'
import ConversationPlatformTabs from '@/modules/conversation/components/conversation-platform-tabs.vue'
import ConversationSettings from '@/modules/conversation/components/conversation-settings.vue'
import config from '@/config'

export default {
  name: 'app-conversation-list-page',

  components: {
    'app-conversation-list-table': ConversationListTable,
    'app-conversation-list-filter': ConversationListFilter,
    'app-conversation-published-tabs': ConversationPublishedTabs,
    'app-conversation-platform-tabs': ConversationPlatformTabs,
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

  methods: {
    ...mapActions({
      doOpenSettingsModal:
        'conversation/doOpenSettingsModal',
      doCloseSettingsModal:
        'conversation/doCloseSettingsModal'
    })
  },

  async mounted() {
    window.analytics.page('Conversations')
  }
}
</script>

<style></style>
