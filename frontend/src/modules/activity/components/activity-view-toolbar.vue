<template>
  <div class="app-page-toolbar mb-8">
    <router-link
      v-if="record && hasPermissionToEdit"
      :to="{ path: `/activity/${record.id}/edit` }"
      class="mr-2"
    >
      <el-button
        icon="ri-lg ri-pencil-line"
        class="btn btn--secondary"
      >
        <app-i18n code="common.edit"></app-i18n>
      </el-button>
    </router-link>

    <el-button
      v-if="record && hasPermissionToDestroy"
      :disabled="destroyLoading"
      icon="ri-lg ri-delete-bin-line"
      class="btn btn--secondary mr-2"
      @click="doDestroyWithConfirm"
    >
      <app-i18n code="common.destroy"></app-i18n>
    </el-button>
  </div>
</template>

<script>
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { AuditLogPermissions } from '@/modules/audit-log/audit-log-permissions'
import { mapGetters, mapActions } from 'vuex'
import { i18n } from '@/i18n'

export default {
  name: 'AppActivityViewToolbar',

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      record: 'activity/view/record',
      loading: 'activity/view/loading',
      destroyLoading: 'activity/destroy/loading'
    }),

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

    hasPermissionToAuditLogs() {
      return new AuditLogPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    }
  },

  methods: {
    ...mapActions({
      doDestroy: 'activity/destroy/doDestroy'
    }),

    async doDestroyWithConfirm() {
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

        return this.doDestroy(this.record.id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style></style>
