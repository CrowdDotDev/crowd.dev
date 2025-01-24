<template>
  <!-- For now only render a special UI for Git -->
  <lf-conversation-drawer-display
    v-if="loading || conversation?.platform === Platform.GIT"
    v-model="isExpanded"
    :conversation="conversation"
    :loading="loading"
  />
  <app-drawer
    v-else
    v-model="isExpanded"
    :size="600"
    :show-footer="false"
    :has-border="true"
    title="Conversation"
  >
    <template
      v-if="conversation"
      #header-label
    >
      <app-activity-link
        :activity="conversation.conversationStarter"
      />
    </template>
    <template #content>
      <app-conversation-details
        v-if="loading"
        :loading="true"
      />
      <div v-else class="h-full">
        <app-conversation-details
          v-if="conversation"
          :conversation="conversation"
        />
        <div v-else>
          <div class="flex justify-center pt-4">
            <lf-icon name="comments-question-check" :size="48" class="text-gray-300" />
          </div>
          <p
            class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
          >
            There was an error loading conversation
          </p>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script>
import { ConversationService } from '@/modules/conversation/conversation-service';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
import AppConversationDetails from '@/modules/conversation/components/conversation-details.vue';
import LfConversationDrawerDisplay from '@/shared/modules/conversation/components/conversation-drawer-display.vue';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfIcon from '@/ui-kit/icon/Icon.vue';

export default {
  name: 'AppConversationDrawer',
  components: { AppConversationDetails, AppActivityLink, LfConversationDrawerDisplay, LfIcon },
  props: {
    conversationId: {
      type: String,
      required: false,
      default: '',
    },
    expand: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      conversation: null,
      Platform,
    };
  },
  computed: {
    isExpanded: {
      get() {
        return this.expand;
      },
      set(expanded) {
        if (!expanded) {
          this.$emit('close');
        }
      },
    },
  },
  watch: {
    conversationId(id) {
      if (id) {
        this.fetchConversation(id);
      }
    },
    isExpanded: {
      handler(newValue) {
        if (newValue) {
          window.analytics.track(
            'Conversation Drawer Opened',
          );
        }
      },
    },
  },
  methods: {
    fetchConversation(conversationId) {
      this.loading = true;
      this.conversation = null;
      ConversationService.find(conversationId)
        .then((conversation) => {
          this.conversation = conversation;
        })
        .catch(() => {
          this.conversation = null;
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>
