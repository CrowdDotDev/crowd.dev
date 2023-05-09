<template>
  <app-drawer
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
            <i
              class="ri-question-answer-line text-4xl h-12 text-gray-300"
            />
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

export default {
  name: 'AppConversationDrawer',
  components: { AppConversationDetails, AppActivityLink },
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
