<template>
  <app-page-wrapper>
    <div class="mb-10">
      <div class="flex items-center justify-between">
        <h4>Reports</h4>
        <router-link
          v-if="hasPermissionToCreate"
          :to="{ path: '/reports/new' }"
        >
          <el-button class="btn btn--primary btn--md">
            Add report
          </el-button>
        </router-link>
      </div>
      <div class="text-xs text-gray-500">
        Build custom widgets, organize them in reports and
        share them publicly
      </div>
    </div>
    <app-report-list-table></app-report-list-table>
  </app-page-wrapper>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import ReportListTable from '@/modules/report/components/report-list-table.vue'
import { ReportPermissions } from '@/modules/report/report-permissions'

export default {
  name: 'AppReportListPage',

  components: {
    AppPageWrapper,
    'app-report-list-table': ReportListTable
  },

  computed: {
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
