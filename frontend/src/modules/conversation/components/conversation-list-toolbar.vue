<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-page-toolbar conversation-list-toolbar"
  >
    <span class="block text-sm font-semibold mr-4"
      >{{ selectedRows.length }}
      {{ selectedRows.length > 1 ? 'rows' : 'row' }}
      selected</span
    >

    <el-tooltip
      v-if="hasPermissionToEdit && hasUnpublishedSelected"
      :content="publishButtonTooltip"
      :disabled="!publishButtonTooltip"
    >
      <span>
        <el-button
          :disabled="publishButtonDisabled"
          class="btn btn--secondary btn--secondary--orange mr-2"
          @click="doPublishAllWithConfirm"
        >
          <i class="ri-lg ri-upload-cloud-2-line mr-1" />
          Publish Conversations
        </el-button>
      </span>
    </el-tooltip>
    <el-tooltip
      v-if="hasPermissionToEdit && hasPublishedSelected"
      :content="publishButtonTooltip"
      :disabled="!publishButtonTooltip"
    >
      <span>
        <el-button
          :disabled="publishButtonDisabled"
          class="btn btn--secondary mr-2"
          @click="doUnpublishAllWithConfirm"
        >
          <i class="ri-lg ri-arrow-go-back-line mr-1" />
          Unpublish Conversations
        </el-button>
      </span>
    </el-tooltip>
    <el-tooltip
      v-if="hasPermissionToDestroy"
      :content="destroyButtonTooltip"
      :disabled="!destroyButtonTooltip"
    >
      <span>
        <el-button
          :disabled="destroyButtonDisabled"
          class="btn btn--secondary mr-2"
          @click="doDestroyAllWithConfirm"
        >
          <i class="ri-lg ri-delete-bin-line mr-1" />
          <app-i18n code="common.destroy"></app-i18n>
        </el-button>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'
import { i18n } from '@/i18n'

export default {
  name: 'AppConversationListToolbar',

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'conversation/hasRows',
      loading: 'conversation/loading',
      selectedRows: 'conversation/selectedRows',
      hasConversationsConfigured:
        'conversation/isConfigured'
    }),

    hasPublishedSelected() {
      return (
        this.selectedRows.filter(
          (r) => r.published === true
        ).length > 0
      )
    },

    hasUnpublishedSelected() {
      return (
        this.selectedRows.filter(
          (r) => r.published === false
        ).length > 0
      )
    },

    hasPermissionToEdit() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    publishButtonDisabled() {
      return (
        !this.selectedRows.length ||
        this.loading('submit') ||
        this.loading('table')
      )
    },

    publishButtonTooltip() {
      if (this.publishButtonDisabled) {
        return i18n('common.mustSelectARow')
      }

      return null
    },

    hasPermissionToDestroy() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    destroyButtonDisabled() {
      return (
        !this.selectedRows.length ||
        this.loading('submit') ||
        this.loading('table')
      )
    },

    destroyButtonTooltip() {
      if (this.destroyButtonDisabled) {
        return i18n('common.mustSelectARow')
      }

      return null
    }
  },

  methods: {
    ...mapActions({
      doDestroyAll: 'conversation/doDestroyAll',
      doPublishAll: 'conversation/doPublishAll',
      doUnpublishAll: 'conversation/doUnpublishAll',
      doOpenSettingsModal:
        'conversation/doOpenSettingsModal'
    }),

    async doDestroyAllWithConfirm() {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        return this.doDestroyAll(
          this.selectedRows.map((item) => item.id)
        )
      } catch (error) {
        // no
      }
    },
    async doPublishAllWithConfirm() {
      if (!this.hasConversationsConfigured) {
        return this.doOpenSettingsModal()
      }
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        await this.doPublishAll(
          this.selectedRows.map((item) => item.id)
        )
      } catch (error) {
        // no
      }
    },

    async doUnpublishAllWithConfirm() {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        await this.doUnpublishAll(
          this.selectedRows.map((item) => item.id)
        )
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style lang="scss">
.conversation-list-toolbar {
  @apply flex items-center justify-end absolute h-16 top-0 mt-1 right-0 z-10 bg-white rounded-tr-xl p-2;
  width: calc(100% - 75px);
}
</style>
