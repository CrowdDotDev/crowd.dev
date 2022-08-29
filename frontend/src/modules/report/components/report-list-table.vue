<template>
  <div class="report-list-table panel">
    <app-report-list-toolbar></app-report-list-toolbar>
    <div class="-mx-6 -mt-4">
      <el-table
        ref="table"
        v-loading="loading('table')"
        :border="true"
        :data="reports"
        row-key="id"
        :row-class-name="rowClass"
        @sort-change="doChangeSort"
      >
        <el-table-column
          type="selection"
          width="75"
        ></el-table-column>

        <el-table-column
          label="Name"
          prop="name"
          sortable="custom"
        >
          <template #default="scope">
            <router-link
              :to="{
                name: 'reportView',
                params: { id: scope.row.id }
              }"
              class="flex items-center text-black"
            >
              <span class="font-semibold">{{
                scope.row.name
              }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="Public">
          <template #default="scope">
            {{ scope.row.public ? 'Yes' : 'No' }}
          </template>
        </el-table-column>
        <el-table-column
          label="# of Widgets"
          prop="widgetsCount"
        >
          <template #default="scope">
            {{ scope.row.widgets.length }}
          </template>
        </el-table-column>
        <el-table-column label="" width="200">
          <template #default="scope">
            <div class="table-actions">
              <app-report-dropdown
                :report="scope.row"
              ></app-report-dropdown>
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
          :page-sizes="[20, 50, 100, 200]"
          @current-change="doChangePaginationCurrentPage"
          @size-change="doChangePaginationPageSize"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { ReportModel } from '@/modules/report/report-model'
import { mapGetters, mapActions } from 'vuex'
import { ReportPermissions } from '@/modules/report/report-permissions'
import { i18n } from '@/i18n'
import ReportDropdown from './report-dropdown'
import ReportListDropdown from './report-list-toolbar'

const { fields } = ReportModel

export default {
  name: 'AppReportListTable',
  components: {
    'app-report-dropdown': ReportDropdown,
    'app-report-list-toolbar': ReportListDropdown
  },

  computed: {
    ...mapGetters({
      rows: 'report/rows',
      count: 'report/count',
      loading: 'report/loading',
      pagination: 'report/pagination',
      selectedRows: 'report/selectedRows',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      paginationLayout: 'layout/paginationLayout'
    }),

    hasPermissionToEdit() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    fields() {
      return fields
    },

    reports() {
      return [...this.rows]
    }
  },

  mounted() {
    this.doMountTable(this.$refs.table)
  },

  methods: {
    ...mapActions({
      doChangeSort: 'report/doChangeSort',
      doChangePaginationCurrentPage:
        'report/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'report/doChangePaginationPageSize',
      doMountTable: 'report/doMountTable',
      doDestroy: 'communityMember/destroy/doDestroy'
    }),

    doRefresh() {
      this.doChangePaginationCurrentPage()
    },

    presenter(row, fieldName) {
      return ReportModel.presenter(row, fieldName)
    },

    translate(key) {
      return i18n(key)
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
.report-list-table {
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
