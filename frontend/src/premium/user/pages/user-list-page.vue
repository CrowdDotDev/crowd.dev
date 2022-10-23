<template>
  <div>
    <app-dialog
      v-model="inviting"
      title="Invite user"
      custom-class="user-invite-dialog"
    >
      <template #content>
        <app-user-new-page @cancel="inviting = false">
        </app-user-new-page>
      </template>
    </app-dialog>

    <!-- TODO: Check if filter button is to be removed -->
    <app-user-list-filter></app-user-list-filter>
    <app-user-list-table
      @invite="inviting = true"
    ></app-user-list-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import UserListFilter from '@/premium/user/components/list/user-list-filter.vue'
import UserListTable from '@/premium/user/components/list/user-list-table.vue'
import UserNewPage from '@/premium/user/pages/user-new-page.vue'
import { UserPermissions } from '@/premium/user/user-permissions'

export default {
  name: 'AppUserListPage',

  components: {
    'app-user-list-filter': UserListFilter,
    'app-user-list-table': UserListTable,
    'app-user-new-page': UserNewPage
  },

  data() {
    return {
      inviting: false
    }
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant'
    }),
    hasPermissionToCreate() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    }
  }
}
</script>

<style lang="scss">
.user-invite-dialog {
  .el-form-item {
    @apply mb-0;
  }
}
</style>
