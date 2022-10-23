<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-page-toolbar user-list-toolbar"
  >
    <span class="block text-sm font-semibold mr-4"
      >{{ selectedRows.length }}
      {{ selectedRows.length > 1 ? 'rows' : 'row' }}
      selected</span
    >

    <el-tooltip
      v-if="hasPermissionToDestroy"
      :content="destroyButtonTooltip"
      :disabled="!destroyButtonTooltip"
    >
      <span>
        <el-button
          :disabled="destroyButtonDisabled"
          class="btn btn--secondary mr-2"
          @click="doDestroyAllWithConfirm()"
        >
          <i class="ri-lg ri-delete-bin-line mr-1" />
          <app-i18n code="common.destroy"></app-i18n>
        </el-button>
      </span>
    </el-tooltip>

    <el-tooltip
      :content="exportButtonTooltip"
      :disabled="!exportButtonTooltip"
    >
      <span>
        <el-button
          :disabled="exportButtonDisabled"
          class="btn btn--secondary mr-2"
          @click="doExport()"
        >
          <i class="ri-lg ri-file-excel-2-line mr-1" />
          <app-i18n code="common.export"></app-i18n>
        </el-button>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
import { AuditLogPermissions } from '@/modules/audit-log/audit-log-permissions'
import { mapGetters, mapActions } from 'vuex'
import { UserPermissions } from '@/premium/user/user-permissions'
import { i18n } from '@/i18n'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppUserListToolbar',

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'user/list/hasRows',
      loading: 'user/list/loading',
      exportLoading: 'user/list/exportLoading',
      selectedRows: 'user/list/selectedRows'
    }),

    hasPermissionToAuditLogs() {
      return new AuditLogPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    hasPermissionToEdit() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    exportButtonDisabled() {
      return (
        !this.hasRows || this.loading || this.exportLoading
      )
    },

    exportButtonTooltip() {
      return !this.hasRows
        ? i18n('common.noDataToExport')
        : null
    },

    destroyButtonDisabled() {
      return !this.selectedRows.length || this.loading
    },

    destroyButtonTooltip() {
      return !this.selectedRows.length
        ? i18n('common.mustSelectARow')
        : null
    }
  },

  methods: {
    ...mapActions({
      doExport: 'user/list/doExport',
      doDestroyAll: 'user/destroy/doDestroyAll'
    }),

    async doDestroyAllWithConfirm() {
      try {
        await ConfirmDialog({
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
        })

        return this.doDestroyAll(
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
.user-list-toolbar {
  @apply flex items-center justify-end absolute h-16 top-0 mt-1 right-0 z-10 bg-white rounded-tr-xl p-2;
  width: calc(100% - 75px);
}
</style>
