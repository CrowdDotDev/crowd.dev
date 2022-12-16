<template>
  <app-page-wrapper>
    <div class="mb-10">
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
import AppReportCreateDialog from '@/modules/report/components/report-create-dialog'
import { ReportPermissions } from '@/modules/report/report-permissions'

export default {
  name: 'AppReportListPage',

  components: {
    AppReportCreateDialog,
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
