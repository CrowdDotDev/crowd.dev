<template>
  <div class="conversation-form-page">
    <div
      class="app-page-spinner"
      v-if="loading('form') || loading('view')"
      v-loading="loading('form') || loading('view')"
    ></div>

    <div v-else class="relative">
      <app-conversation-form
        :isEditing="editing && isEditing"
        :record="conversation"
        :saveLoading="loading('submit')"
        @edit="editing = true"
        @cancel="handleCancel"
        @submit="handleSubmit"
        @publish="handlePublish"
        @unpublish="handleUnpublish"
      />
      <div class="font-semibold mb-2">Activities:</div>
      <app-activity-list-feed-item
        v-for="activity in conversation.activities"
        :activity="activity"
        :key="activity.id"
        :belongs-to-conversation="true"
      ></app-activity-list-feed-item>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ConversationForm from '@/modules/conversation/components/conversation-form.vue'
import ActivityListFeedItem from '@/modules/activity/components/activity-list-feed-item'

export default {
  name: 'app-conversation-form-page',

  props: ['id'],

  components: {
    'app-conversation-form': ConversationForm,
    'app-activity-list-feed-item': ActivityListFeedItem
  },

  computed: {
    ...mapGetters({
      conversationFind: 'conversation/find',
      record: 'conversation/form',
      loading: 'conversation/loading'
    }),

    isEditing() {
      return Boolean(this.id)
    },

    conversation() {
      return this.conversationFind(this.id)
    }
  },

  async created() {
    await this.doFind(this.id)
    await this.doInitForm(this.id)
  },

  data() {
    return {
      editing: false
    }
  },

  methods: {
    ...mapActions({
      doInitForm: 'conversation/doInitForm',
      doFind: 'conversation/doFind',
      doUpdate: 'conversation/doUpdate',
      doPublish: 'conversation/doPublish',
      doUnpublish: 'conversation/doUnpublish'
    }),

    handleCancel() {
      this.editing = false
    },
    async handleSubmit(payload) {
      this.editing = false
      await this.doUpdate(payload)
    },
    async handlePublish(payload) {
      this.editing = false
      await this.doPublish(payload)
    },
    async handleUnpublish(payload) {
      this.editing = false
      await this.doUnpublish(payload)
    }
  }
}
</script>

<style lang="scss">
.conversation-form-page {
  .app-content-title {
    @apply mb-0 h-16 leading-none pb-6;
  }
  .el-form.conversation-form {
    @apply h-16;
  }
}
</style>
