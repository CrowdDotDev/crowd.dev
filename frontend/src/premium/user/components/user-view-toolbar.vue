<template>
  <div class="app-page-toolbar">
    <router-link
      :to="{ path: `/user/${record.id}/edit` }"
      v-if="record && hasPermissionToEdit"
    >
      <el-button
        icon="ri-lg ri-pencil-line"
        class="btn btn--primary"
      >
        <app-i18n code="common.edit"></app-i18n>
      </el-button>
    </router-link>
  </div>
</template>

<script>
import { UserPermissions } from '@/premium/user/user-permissions'
import { AuditLogPermissions } from '@/modules/audit-log/audit-log-permissions'
import { mapGetters } from 'vuex'

export default {
  name: 'app-user-view-toolbar',

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      record: 'user/view/record',
      loading: 'user/view/loading'
    }),

    hasPermissionToEdit() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToAuditLogs() {
      return new AuditLogPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    }
  }
}
</script>

<style></style>
