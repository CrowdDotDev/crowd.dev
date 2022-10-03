<template>
  <div class="automation-list-table panel">
    <div class="-mx-6 -mt-4">
      <el-table
        ref="table"
        :loading="loading('table')"
        :data="rows"
        row-key="id"
        border
        :default-sort="{
          prop: 'lastActive',
          order: 'descending'
        }"
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
      >
        <el-table-column
          type="selection"
          width="75"
        ></el-table-column>
        <el-table-column label="Webhook">
          <template #default="scope">
            <div class="font-medium text-black">
              {{
                translate(
                  `entities.automation.triggers.${scope.row.trigger}`
                )
              }}
            </div>
            <div class="text-gray-600">
              {{ scope.row.settings.url }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Created on" width="150">
          <template #default="scope">
            <el-tooltip
              :content="formattedDate(scope.row.createdAt)"
              placement="top"
            >
              {{ timeAgo(scope.row.createdAt) }}
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="Last execution" width="150">
          <template #default="scope">
            <el-tooltip
              v-if="scope.row.lastExecutionAt"
              :content="
                formattedDate(scope.row.lastExecutionAt)
              "
              placement="top"
            >
              {{ timeAgo(scope.row.createdAt) }}
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="100">
          <template #default="scope"
            ><app-automation-toggle :automation="scope.row"
          /></template>
        </el-table-column>
        <el-table-column label="" width="70">
          <template #default="scope">
            <div class="table-actions">
              <app-automation-dropdown
                :automation="scope.row"
              ></app-automation-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="el-pagination-wrapper px-3">
        <el-pagination
          :current-page="pagination.currentPage || 1"
          :disabled="loading('table')"
          :layout="paginationLayout"
          :total="count"
          :page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="doChangePaginationCurrentPage"
          @size-change="doChangePaginationPageSize"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters, mapActions } from 'vuex'
import { AutomationPermissions } from '@/modules/automation/automation-permissions'
import { AutomationModel } from '@/modules/automation/automation-model'
import { i18n } from '@/i18n'
import AutomationDropdown from './automation-dropdown'
import AutomationToggle from './automation-toggle'
import computedTimeAgo from '@/utils/time-ago'
const { fields } = AutomationModel

export default {
  name: 'AppAutomationListTable',
  components: {
    'app-automation-dropdown': AutomationDropdown,
    'app-automation-toggle': AutomationToggle
  },
  computed: {
    ...mapGetters({
      rows: 'automation/rows',
      count: 'automation/count',
      loading: 'automation/loading',
      pagination: 'automation/pagination',
      selectedRows: 'automation/selectedRows',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout'
    }),

    hasPermissionToEdit() {
      return new AutomationPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new AutomationPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
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
      doChangeSort: 'conversation/doChangeSort',
      doChangePaginationCurrentPage:
        'conversation/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'conversation/doChangePaginationPageSize',
      doMountTable: 'conversation/doMountTable',
      doDestroy: 'member/doDestroy'
    }),

    doRefresh() {
      this.doChangePaginationCurrentPage()
    },

    presenter(row, fieldName) {
      return AutomationModel.presenter(row, fieldName)
    },

    translate(key) {
      return i18n(key)
    },

    rowClass({ row }) {
      const isSelected =
        this.selectedRows.find((r) => r.id === row.id) !==
        undefined
      return isSelected ? 'is-selected' : ''
    },
    timeAgo(date) {
      return computedTimeAgo(date)
    },
    formattedDate(date) {
      return moment(date).format('YYYY-MM-DD HH:mm:ss')
    }
  }
}
</script>

<style lang="scss">
.automation-list-table {
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
