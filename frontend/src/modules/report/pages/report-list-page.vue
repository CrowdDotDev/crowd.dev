<template>
  <app-page-wrapper>
    <div class="mb-12">
      <div class="flex items-center justify-between">
        <h4>Reports</h4>
        <el-button
          v-if="!!count"
          class="btn btn--primary btn--md"
          @click="isCreatingReport = true"
        >
          Add report
        </el-button>
      </div>
      <div class="text-xs text-gray-500">
        Build custom widgets, organize them in reports and
        share them publicly
      </div>
    </div>

    <!-- TODO: Refactor this -->
    <div class="text-gray-900 font-semibold text-base mb-6">
      Default reports
    </div>

    <div class="grid grid-cols-3">
      <router-link
        :to="{
          path: 'reports/members'
        }"
      >
        <div class="bg-white p-5 rounded-lg shadow">
          <div
            class="flex items-center justify-between mb-8"
          >
            <div
              class="bg-gray-900 rounded-md h-10 w-10 flex items-center justify-center"
            >
              <i
                class="text-white text-xl ri-account-circle-line"
              />
            </div>

            <div class="flex items-center gap-3">
              <div
                class="text-green-600 text-xs flex items-center gap-1"
              >
                <i class="ri-global-line" /><span
                  >Public</span
                >
              </div>
              <app-report-template-dropdown
                :report="{ public: true }"
              ></app-report-template-dropdown>
            </div>
          </div>
          <div
            class="text-gray-900 text-base font-medium mb-3"
          >
            Members report
          </div>
          <div class="text-gray-500 text-xs">
            Get insights into total/active/returning members
            and a member leaderboard
          </div>
        </div>
      </router-link>
    </div>

    <el-divider class="mb-6 mt-14 border-gray-200" />

    <div class="text-gray-900 font-semibold text-base mb-6">
      Custom reports
    </div>
    <app-report-list-table
      @cta-click="isCreatingReport = true"
    ></app-report-list-table>
    <app-report-create-dialog
      v-model="isCreatingReport"
    ></app-report-create-dialog>
  </app-page-wrapper>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import ReportListTable from '@/modules/report/components/report-list-table.vue'
import AppReportCreateDialog from '@/modules/report/components/report-create-dialog.vue'
import { ReportPermissions } from '@/modules/report/report-permissions'
import AppReportTemplateDropdown from '@/modules/report/components/report-template-dropdown.vue'

export default {
  name: 'AppReportListPage',

  components: {
    AppReportCreateDialog,
    AppReportTemplateDropdown,
    'app-report-list-table': ReportListTable
  },

  data() {
    return {
      isCreatingReport: false
    }
  },

  computed: {
    ...mapState({
      count: (state) => state.report.count
    }),
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),
    hasPermissionToCreate() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    }
  },

  created() {
    this.doFetch({
      keepPagination: true
    })
  },

  async mounted() {
    window.analytics.page('Reports')
  },

  methods: {
    ...mapActions({
      doFetch: 'report/doFetch'
    })
  }
}
</script>

<style></style>
