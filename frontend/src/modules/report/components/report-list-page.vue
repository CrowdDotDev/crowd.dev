<template>
  <div>
    <h1 class="app-content-title">
      <app-i18n code="entities.report.name"></app-i18n>
    </h1>
    <div class="flex items-center justify-end mb-4">
      <portal-target
        name="report-filter-toggle"
      ></portal-target>

      <router-link
        :to="{ path: '/reports/new' }"
        v-if="hasPermissionToCreate"
      >
        <el-button
          icon="ri-lg ri-add-line"
          class="btn btn--primary ml-2"
        >
          <app-i18n code="common.new"></app-i18n>
        </el-button>
      </router-link>
    </div>

    <app-report-list-table></app-report-list-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import ReportListTable from '@/modules/report/components/report-list-table.vue'
import { ReportPermissions } from '@/modules/report/report-permissions'

export default {
  name: 'app-report-list-page',

  components: {
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

  methods: {
    ...mapActions({
      doFetch: 'report/doFetch'
    })
  },

  created() {
    this.doFetch({
      keepPagination: true
    })
  },

  async mounted() {
    window.analytics.page('Reports')
  }
}
</script>

<style></style>
