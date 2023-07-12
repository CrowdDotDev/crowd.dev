<template>
  <div
    class="flex items-center py-1 mb-3 mt-2 justify-between"
  >
    <app-pagination-sorter
      :page-size="Number(pagination.pageSize)"
      :total="count"
      :current-page="pagination.currentPage"
      :has-page-counter="false"
      :sorter="false"
      module="user"
      position="top"
    />

    <el-button
      class="btn btn--primary btn--sm"
      @click.prevent="() => $emit('invite')"
    >
      <i class="ri-lg ri-mail-line mr-1" />
      <span class="leading-5">Invite user</span>
    </el-button>
  </div>

  <div class="app-list-table not-clickable panel">
    <app-user-list-toolbar />
    <div class="-mx-6 -mt-6">
      <el-table
        ref="table"
        v-loading="loading"
        :data="rows"
        row-key="id"
        :bordered="true"
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
      >
        <el-table-column
          type="selection"
          width="75"
        />

        <el-table-column
          :width="250"
          :label="fields.fullName.label"
          :prop="fields.fullName.name"
          sortable="custom"
        >
          <template #default="scope">
            {{ presenter(scope.row, 'fullName') ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column
          :width="400"
          :label="fields.email.label"
          :prop="fields.email.name"
          sortable="custom"
        >
          <template #default="scope">
            {{ presenter(scope.row, 'email') }}
          </template>
        </el-table-column>

        <el-table-column
          :width="100"
          :label="fields.role.label"
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
        >
          <template #default="scope">
            <span
              class="badge"
              :class="{
                'badge--green':
                  scope.row[fields.status.name]
                  === 'active',
                'badge--red':
                  scope.row[fields.status.name]
                  === 'empty-permissions',
              }"
            >{{ presenter(scope.row, 'status') }}</span>
          </template>
        </el-table-column>

        <el-table-column
          fixed="right"
          align="center"
          width="120"
        >
          <template #default="scope">
            <div class="table-actions">
              <app-user-dropdown
                :user="scope.row"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!!count" class="mt-8 px-6">
        <app-pagination
          :total="count"
          :page-size="Number(pagination.pageSize)"
          :current-page="pagination.currentPage || 1"
          module="user"
          @change-current-page="doChangePaginationCurrentPage"
          @change-page-size="doChangePaginationPageSize"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import pluralize from 'pluralize';
import { UserModel } from '@/modules/user/user-model';
import { UserPermissions } from '@/modules/user/user-permissions';
import UserListToolbar from '@/modules/user/components/list/user-list-toolbar.vue';
import Roles from '@/security/roles';
import AppUserDropdown from '../user-dropdown.vue';

const { fields } = UserModel;

export default {
  name: 'AppUserListTable',

  components: {
    AppUserDropdown,
    'app-user-list-toolbar': UserListToolbar,
  },

  emits: ['invite'],

  computed: {
    ...mapGetters({
      rows: 'user/list/rows',
      count: 'user/list/count',
      loading: 'user/list/loading',
      selectedRows: 'user/list/selectedRows',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      pagination: 'user/list/pagination',
    }),

    hasPermissionToDestroy() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser,
      ).destroy;
    },

    hasPermissionToEdit() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser,
      ).edit;
    },

    fields() {
      return fields;
    },
  },

  mounted() {
    this.doMountTable(this.$refs.table);
  },

  methods: {
    ...mapActions({
      doChangeSort: 'user/list/doChangeSort',
      doMountTable: 'user/list/doMountTable',
      doChangePaginationCurrentPage: 'user/list/doChangePaginationCurrentPage',
      doChangePaginationPageSize: 'user/list/doChangePaginationPageSize',
      doDestroy: 'user/destroy/doDestroy',
    }),

    roleDescriptionOf(roleId) {
      return Roles.descriptionOf(roleId);
    },

    roleLabelOf(roleId) {
      return Roles.labelOf(roleId);
    },

    presenter(row, fieldName) {
      return UserModel.presenter(row, fieldName);
    },

    rowClass({ row }) {
      const isSelected = this.selectedRows.find((r) => r.id === row.id)
        !== undefined;
      return isSelected ? 'is-selected' : '';
    },

    pluralize,
  },
};
</script>
