<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4"
      >{{ selectedRows.length }}
      {{
        selectedRows.length > 1
          ? 'conversations'
          : 'conversation'
      }}
      selected</span
    >
    <el-dropdown trigger="click">
      <button class="btn btn--bordered btn--sm">
        <span class="mr-2">Actions</span>
        <i class="ri-xl ri-arrow-down-s-line"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item
          v-if="
            hasPermissionToEdit && hasUnpublishedSelected
          "
          :disabled="isReadOnly"
          @click="doPublishAllWithConfirm"
        >
          <i class="ri-lg ri-upload-cloud-2-line mr-1" />
          Publish Conversations
        </el-dropdown-item>
        <el-dropdown-item
          v-if="hasPermissionToEdit && hasPublishedSelected"
          :disabled="isReadOnly"
          @click="doUnpublishAllWithConfirm"
        >
          <i class="ri-lg ri-arrow-go-back-line mr-1" />
          Unpublish Conversations
        </el-dropdown-item>
        <hr class="border-gray-200 my-1 mx-2" />
        <el-dropdown-item
          v-if="hasPermissionToDestroy"
          command="destroyAll"
          :disabled="isReadOnly"
          @click="doDestroyAllWithConfirm"
        >
          <div class="text-red-500 flex items-center">
            <i class="ri-lg ri-delete-bin-line mr-1" />
            <app-i18n code="common.destroy"></app-i18n>
          </div>
        </el-dropdown-item>
      </template>
    </el-dropdown>
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

    isReadOnly() {
      return (
        new ConversationPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    },

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
      doOpenSettingsDrawer:
        'conversation/doOpenSettingsDrawer'
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
        return this.doOpenSettingsDrawer()
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
