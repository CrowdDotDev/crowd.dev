<template>
  <div class="report-view-page">
    <div class="flex items-start justify-between">
      <h1 class="app-content-title">
        {{ report.name }}
      </h1>
      <app-report-dropdown
        :report="report"
        :show-view-report="false"
      ></app-report-dropdown>
    </div>
    <div
      v-if="loading('view')"
      v-loading="loading('view')"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <app-report-grid-layout
        v-model="report"
        class="-mx-4"
      ></app-report-grid-layout>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from './report-grid-layout'
import ReportDropdown from './report-dropdown'

export default {
  name: 'AppReportViewPage',

  components: {
    'app-report-grid-layout': ReportGridLayout,
    'app-report-dropdown': ReportDropdown
  },

  props: {
    id: {
      type: String,
      default: null
    }
  },

  computed: {
    ...mapGetters({
      reportFind: 'report/find',
      loading: 'report/loading'
    }),
    report() {
      return this.reportFind(this.id)
    }
  },

  async created() {
    await this.doFind(this.id)
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind'
    })
  }
}
</script>

<style lang="scss">
.report-view-page {
  @apply relative;

  .el-dropdown {
    @apply absolute top-0 right-0;
  }
}
</style>
