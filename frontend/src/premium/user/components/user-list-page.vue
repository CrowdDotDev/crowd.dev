<template>
  <div>
    <div class="flex items-center justify-end mb-4">
      <portal-target
        name="user-filter-toggle"
      ></portal-target>

      <el-button
        icon="ri-lg ri-mail-line"
        class="btn btn--primary ml-2"
        @click.prevent="inviting = true"
      >
        Invite
      </el-button>
    </div>

    <el-dialog
      :visible.sync="inviting"
      title="Invite User"
      :append-to-body="true"
      :destroy-on-close="true"
      @close="inviting = false"
      custom-class="el-dialog--lg"
    >
      <app-user-new-page @cancel="inviting = false">
      </app-user-new-page>
    </el-dialog>
    <app-user-list-filter></app-user-list-filter>
    <app-user-list-table></app-user-list-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import UserListFilter from '@/premium/user/components/user-list-filter.vue'
import UserListTable from '@/premium/user/components/user-list-table.vue'
import UserNewPage from '@/premium/user/components/user-new-page.vue'
import { UserPermissions } from '@/premium/user/user-permissions'

export default {
  name: 'app-user-list-page',

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

<style></style>
