<template>
  <div class="user-list-table panel">
    <app-user-list-toolbar></app-user-list-toolbar>
    <div class="-mx-6 -mt-4">
      <el-table
        ref="table"
        v-loading="loading"
        :data="rows"
        row-key="id"
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
      >
        <el-table-column
          type="selection"
          width="75"
        ></el-table-column>

        <el-table-column
          :label="fields.email.label"
          :prop="fields.email.name"
          sortable="custom"
        >
          <template #default="scope">
            {{ presenter(scope.row, 'email') }}
          </template>
        </el-table-column>

        <el-table-column
          :label="fields.fullName.label"
          :prop="fields.fullName.name"
          sortable="custom"
        >
          <template #default="scope">
            {{ presenter(scope.row, 'fullName') }}
          </template>
        </el-table-column>

        <el-table-column
          :label="fields.roles.label"
          :prop="fields.roles.name"
        >
          <template #default="scope">
            <div
              v-for="roleId in scope.row.roles"
              :key="roleId"
            >
              <el-tooltip
                :content="roleDescriptionOf(roleId)"
              >
                <span>{{ roleLabelOf(roleId) }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :label="fields.status.label"
          :prop="fields.status.name"
          sortable="custom"
        >
          <template #default="scope">
            <el-tag
              :type="
                scope.row[fields.status.name] === 'invited'
                  ? 'warning'
                  : scope.row[fields.status.name] ===
                    'empty-permissions'
                  ? 'danger'
                  : 'success'
              "
            >
              {{ presenter(scope.row, 'status') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :fixed="isMobile ? undefined : 'right'"
          align="center"
          width="120"
        >
          <template #default="scope">
            <div class="table-actions">
              <app-user-dropdown
                :user="scope.row"
              ></app-user-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="el-pagination-wrapper px-3">
        <el-pagination
          :current-page="pagination.currentPage || 1"
          :disabled="loading"
          :layout="paginationLayout"
          :total="count"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="doChangePaginationCurrentPage"
          @size-change="doChangePaginationPageSize"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { UserModel } from '@/premium/user/user-model'
import { mapGetters, mapActions } from 'vuex'
import { UserPermissions } from '@/premium/user/user-permissions'
import UserListToolbar from '@/premium/user/components/user-list-toolbar.vue'
import Roles from '@/security/roles'
import { i18n } from '@/i18n'
import AppUserDropdown from './user-dropdown'

const { fields } = UserModel

export default {
  name: 'AppUserListTable',

  components: {
    AppUserDropdown,
    'app-user-list-toolbar': UserListToolbar
  },

  computed: {
    ...mapGetters({
      rows: 'user/list/rows',
      count: 'user/list/count',
      loading: 'user/list/loading',
      selectedRows: 'user/list/selectedRows',
      pagination: 'user/list/pagination',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout'
    }),

    hasPermissionToDestroy() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    hasPermissionToEdit() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    fields() {
      return fields
    }
  },

  mounted() {
    this.doMountTable(this.$refs.table)
  },

  methods: {
    ...mapActions({
      doChangeSort: 'user/list/doChangeSort',
      doChangePaginationCurrentPage:
        'user/list/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'user/list/doChangePaginationPageSize',
      doMountTable: 'user/list/doMountTable',
      doDestroy: 'user/destroy/doDestroy'
    }),

    roleDescriptionOf(roleId) {
      return Roles.descriptionOf(roleId)
    },

    roleLabelOf(roleId) {
      return Roles.labelOf(roleId)
    },

    presenter(row, fieldName) {
      return UserModel.presenter(row, fieldName)
    },

    async doDestroyWithConfirm(id) {
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

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    },

    rowClass({ row }) {
      const isSelected =
        this.selectedRows.find((r) => r.id === row.id) !==
        undefined
      return isSelected ? 'is-selected' : ''
    }
  }
}
</script>

<style lang="scss">
.user-list-table {
  @apply relative;
  .el-table {
    @apply mt-0 border-t-0;

    th {
      @apply pb-4;
    }

    .el-table-column--selection {
      .cell {
        @apply p-0 pl-4;
      }
    }
  }
}
</style>
