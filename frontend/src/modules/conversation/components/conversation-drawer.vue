<template>
  <el-drawer
    v-model="isExpanded"
    :show-close="false"
    :size="600"
  >
    <template #header="{ close }">
      <div
        class="flex justify-between items-center border-b border-gray-200 -mb-4 -mx-6 px-6 pb-6"
      >
        <h2 class="text-lg font-medium text-gray-1000">
          Conversation
        </h2>
        <div class="flex items-center">
          <div v-if="conversation" class="pr-6">
            <app-activity-link
              :activity="conversation.conversationStarter"
            />
          </div>
          <div
            class="p-2 flex cursor-pointer"
            @click="close"
          >
            <i
              class="ri-close-line text-xl flex items-center h-6 w-6 text-gray-400"
            ></i>
          </div>
        </div>
      </div>
    </template>
    <template #default>
      <app-conversation-details
        v-if="loading"
        :loading="true"
      />
      <div v-else>
        <app-conversation-details
          v-if="conversation"
          :conversation="conversation"
        />
        <div v-else>
          <div class="flex justify-center pt-4">
            <i
              class="ri-question-answer-line text-4xl h-12 text-gray-300"
            ></i>
          </div>
          <p
            class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
          >
            There was an error loading conversation
          </p>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script>
import { ConversationService } from '@/modules/conversation/conversation-service'
import AppActivityLink from '@/modules/activity/components/activity-link'
import AppConversationDetails from '@/modules/conversation/components/conversation-details'

export default {
  name: 'AppConversationDrawer',
  components: { AppConversationDetails, AppActivityLink },
  props: {
    conversationId: {
      type: String,
      required: false,
      default: ''
    },
    expand: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      conversation: null
    }
  },
  computed: {
    isExpanded: {
      get() {
        return this.expand
      },
      set(expanded) {
        if (!expanded) {
          this.$emit('close')
        }
      }
    }
  },
  watch: {
    conversationId(id) {
      if (id) {
        this.fetchConversation(id)
      }
    }
  },
  methods: {
    fetchConversation(conversationId) {
      this.loading = true
      this.conversation = null
      ConversationService.find(conversationId)
        .then((conversation) => {
          this.conversation = conversation
        })
        .catch(() => {
          this.conversation = null
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>
