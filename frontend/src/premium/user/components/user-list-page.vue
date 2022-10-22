<template>
  <div>
    <el-dialog
      v-model="inviting"
      :close-on-click-modal="false"
      :append-to-body="true"
      :destroy-on-close="true"
      :show-close="false"
      custom-class="el-dialog--lg user-invite-dialog"
      @close="inviting = false"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="flex grow justify-between items-center">
          <h5 :id="titleId" :class="titleClass">
            Invite User
          </h5>
          <el-button
            class="btn btn--transparent btn--xs w-8 !h-8"
            @click="close"
          >
            <i
              class="ri-close-line text-lg text-gray-400"
            ></i>
          </el-button>
        </div>
      </template>
      <app-user-new-page @cancel="inviting = false">
      </app-user-new-page>
    </el-dialog>
    <!-- TODO: Check if filter button is to be removed -->
    <app-user-list-filter></app-user-list-filter>
    <app-user-list-table
      @invite="inviting = true"
    ></app-user-list-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import UserListFilter from '@/premium/user/components/user-list-filter.vue'
import UserListTable from '@/premium/user/components/user-list-table.vue'
import UserNewPage from '@/premium/user/components/user-new-page.vue'
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
