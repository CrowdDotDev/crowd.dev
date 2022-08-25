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
      class="app-page-spinner"
      v-if="loading('view')"
      v-loading="loading('view')"
    ></div>
    <div v-else>
      <app-report-grid-layout
        class="-mx-4"
        v-model="report"
      ></app-report-grid-layout>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from './report-grid-layout'
import ReportDropdown from './report-dropdown'

export default {
  name: 'app-report-view-page',

  props: ['id'],

  components: {
    'app-report-grid-layout': ReportGridLayout,
    'app-report-dropdown': ReportDropdown
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
