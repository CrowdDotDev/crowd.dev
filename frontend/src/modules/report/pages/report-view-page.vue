<template>
  <div class="report-view-page">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div class="flex items-start justify-between">
        <h1 class="app-content-title">
          {{ report.name }}
        </h1>
        <app-report-dropdown
          :report="report"
          :show-view-report="false"
        ></app-report-dropdown>
      </div>
      <app-report-grid-layout
        v-model="report"
        class="-mx-4"
      ></app-report-grid-layout>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from '../components/report-grid-layout'
import ReportDropdown from '../components/report-dropdown'

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

  data() {
    return {
      loading: false
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
    this.loading = true
    await this.doFind(this.id)
    this.loading = false
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
