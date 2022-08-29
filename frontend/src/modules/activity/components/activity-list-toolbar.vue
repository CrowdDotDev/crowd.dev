<template>
  <div class="app-page-toolbar">
    <el-tooltip
      :content="exportButtonTooltip"
      :disabled="!exportButtonTooltip"
    >
      <span>
        <el-button
          :disabled="exportButtonDisabled"
          icon="ri-lg ri-file-excel-2-line"
          class="btn btn--secondary mr-2"
          @click="doExport()"
        >
          <app-i18n code="common.export"></app-i18n>
        </el-button>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
import { AuditLogPermissions } from '@/modules/audit-log/audit-log-permissions'
import { mapGetters, mapActions } from 'vuex'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { i18n } from '@/i18n'

export default {
  name: 'AppActivityListToolbar',

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'activity/list/hasRows',
      loading: 'activity/list/loading',
      exportLoading: 'activity/list/exportLoading',
      selectedRows: 'activity/list/selectedRows',
      destroyLoading: 'activity/destroy/loading'
    }),

    hasPermissionToAuditLogs() {
      return new AuditLogPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    hasPermissionToCreate() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    },

    hasPermissionToEdit() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToImport() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).import
    },

    hasPermissionToDestroy() {
      return new ActivityPermissions(
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

    removeButtonDisabled() {
      return !this.selectedRows.length || this.loading
    },

    removeButtonTooltip() {
      return !this.selectedRows.length
        ? i18n('common.mustSelectARow')
        : null
    },

    enableButtonDisabled() {
      return !this.selectedRows.length || this.loading
    },

    enableButtonTooltip() {
      return !this.selectedRows.length
        ? i18n('common.mustSelectARow')
        : null
    },

    disableButtonDisabled() {
      return !this.selectedRows.length || this.loading
    },

    disableButtonTooltip() {
      return !this.selectedRows.length
        ? i18n('common.mustSelectARow')
        : null
    },

    destroyButtonDisabled() {
      return (
        !this.selectedRows.length ||
        this.loading ||
        this.destroyLoading
      )
    },

    destroyButtonTooltip() {
      if (!this.selectedRows.length || this.loading) {
        return i18n('common.mustSelectARow')
      }

      return null
    }
  },

  methods: {
    ...mapActions({
      doExport: 'activity/list/doExport',
      doRemoveAllSelected:
        'activity/list/doRemoveAllSelected',
      doDisableAllSelected:
        'activity/list/doDisableAllSelected',
      doEnableAllSelected:
        'activity/list/doEnableAllSelected',
      doDestroyAll: 'activity/destroy/doDestroyAll'
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
    }
  }
}
</script>

<style></style>
