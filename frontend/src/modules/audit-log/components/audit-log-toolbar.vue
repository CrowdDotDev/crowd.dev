<template>
  <div class="app-page-toolbar">
    <el-tooltip
      :content="exportButtonTooltip"
      :disabled="!exportButtonTooltip"
    >
      <span>
        <el-button
          :disabled="exportButtonDisabled"
          @click="doExport"
          icon="el-icon-fa-file-excel-o"
        >
          <app-i18n code="common.export"></app-i18n>
        </el-button>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'app-audit-log-toolbar',

  computed: {
    ...mapGetters({
      hasRows: 'auditLog/hasRows',
      loading: 'auditLog/loading',
      exportLoading: 'auditLog/exportLoading'
    }),

    exportButtonDisabled() {
      return (
        !this.hasRows || this.loading || this.exportLoading
      )
    },

    exportButtonTooltip() {
      if (!this.hasRows || this.loading) {
        return i18n('common.noDataToExport')
      }

      return undefined
    }
  },

  methods: {
    ...mapActions({
      doExport: 'auditLog/doExport'
    })
  }
}
</script>

<style></style>
