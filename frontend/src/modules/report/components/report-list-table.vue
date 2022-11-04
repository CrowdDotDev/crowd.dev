<template>
  <div class="pt-3">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>

    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="count === 0"
        icon="ri-bar-chart-line"
        title="No reports yet"
        description="Please create your first report to start analyzing data from your community"
        cta-btn="Add report"
        @cta-click="$emit('cta-click')"
      ></app-empty-state-cta>

      <div v-else>
        <!-- Sorter -->
        <div class="mb-2">
          <app-pagination-sorter
            :page-size="Number(pagination.pageSize)"
            :total="count"
            :current-page="pagination.currentPage"
            :has-page-counter="false"
            module="report"
            position="top"
            @change-sorter="doChangePaginationPageSize"
          />
        </div>

        <!-- Sorters list -->
        <div class="app-list-table panel">
          <app-report-list-toolbar></app-report-list-toolbar>
          <div class="-mx-6 -mt-6">
            <el-table
              ref="table"
              v-loading="loading"
              :data="reports"
              row-key="id"
              border
              :row-class-name="rowClass"
              @sort-change="doChangeSort"
              @row-click="handleRowClick"
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
                      params: {
                        id: scope.row.id
                      }
                    }"
                    class="flex items-center text-black"
                  >
                    <span class="font-semibold">{{
                      scope.row.name
                    }}</span>
                  </router-link>
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
              <el-table-column label="Visibility">
                <template #default="scope">
                  <span
                    v-if="scope.row.public"
                    class="badge badge--green"
                    >Public</span
                  >
                  <span v-else class="badge">Private</span>
                </template>
              </el-table-column>
              <el-table-column
                label=""
                width="200"
                fixed="right"
              >
                <template #default="scope">
                  <div class="table-actions">
                    <app-report-dropdown
                      :report="scope.row"
                    ></app-report-dropdown>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="!!count" class="mt-8 px-6">
              <app-pagination
                :total="count"
                :page-size="Number(pagination.pageSize)"
                :current-page="pagination.currentPage || 1"
                module="report"
                @change-current-page="
                  doChangePaginationCurrentPage
                "
                @change-page-size="
                  doChangePaginationPageSize
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ReportModel } from '@/modules/report/report-model'
import { mapGetters, mapActions, mapState } from 'vuex'
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

  emits: ['cta-click'],

  data() {
    return {
      mountTableInterval: null
    }
  },

  computed: {
    ...mapState({
      loading: (state) => state.report.list.loading,
      count: (state) => state.report.count
    }),
    ...mapGetters({
      rows: 'report/rows',
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
    this.mountTableInterval = setInterval(
      this.doMountTableInterval,
      1000
    )
  },

  methods: {
    ...mapActions({
      doChangeSort: 'report/doChangeSort',
      doChangePaginationCurrentPage:
        'report/doChangePaginationCurrentPage',
      doChangePaginationPageSize:
        'report/doChangePaginationPageSize',
      doMountTable: 'report/doMountTable',
      doDestroy: 'member/doDestroy'
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
    },

    handleRowClick(row) {
      this.$router.push({
        name: 'reportView',
        params: { id: row.id }
      })
    },

    doMountTableInterval() {
      // TODO: Need to refactor this component to options api and this method to watch instead of setInterval
      if (
        this.$refs.table !==
        this.$store.state.report.list.table
      ) {
        this.doMountTable(this.$refs.table)
        clearInterval(this.mountTableInterval)
      }
    }
  }
}
</script>
