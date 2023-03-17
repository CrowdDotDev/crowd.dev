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

    <app-user-list-table
      @invite="inviting = true"
    ></app-user-list-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import UserListTable from '@/modules/user/components/list/user-list-table.vue'
import UserNewPage from '@/modules/user/pages/user-new-page.vue'
import { UserPermissions } from '@/modules/user/user-permissions'

export default {
  name: 'AppUserListPage',

  components: {
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
  },

  async mounted() {
    await this.doFetch()
  },

  methods: {
    ...mapActions({
      doFetch: 'user/list/doFetch'
    })
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
