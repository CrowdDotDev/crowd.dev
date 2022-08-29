<template>
  <div v-if="isReadOnly">
    <el-button
      icon="ri-lg ri-clipboard-line"
      class="btn btn--secondary"
      @click="copyToClipboard(report.id)"
    >
      Copy Public Url
    </el-button>
  </div>
  <div v-else>
    <el-dropdown trigger="click" @command="handleCommand">
      <span class="el-dropdown-link">
        <i class="text-xl ri-more-line"></i>
      </span>
      <el-dropdown-menu>
        <el-dropdown-item
          v-if="report.public"
          icon="ri-link"
          :command="{
            action: 'reportPublicUrl',
            report: report
          }"
          >Copy Public Url</el-dropdown-item
        >
        <el-dropdown-item
          v-if="showViewReport"
          icon="ri-eye-line"
          :command="{
            action: 'reportView',
            report: report
          }"
          >View Report</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-pencil-line"
          :command="{
            action: 'reportEdit',
            report: report
          }"
          >Edit Report</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-delete-bin-line"
          :command="{
            action: 'reportDelete',
            report: report
          }"
          >Delete Report</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import Message from '@/shared/message/message'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { ReportPermissions } from '@/modules/report/report-permissions'

export default {
  name: 'AppReportDropdown',
  props: {
    report: {
      type: Object,
      default: () => {}
    },
    showViewReport: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),
    isReadOnly() {
      return (
        new ReportPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    }
  },
  methods: {
    ...mapActions({
      doDestroy: 'report/doDestroy'
    }),
    async doDestroyWithConfirm(id) {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    },
    async handleCommand(command) {
      if (command.action === 'reportDelete') {
        return await this.doDestroyWithConfirm(
          command.report.id
        )
      } else if (command.action === 'reportPublicUrl') {
        return await this.copyToClipboard(command.report.id)
      } else {
        return this.$router.push({
          name: command.action,
          params: { id: command.report.id }
        })
      }
    },
    async copyToClipboard(value) {
      const tenantId = AuthCurrentTenant.get()
      const url = `${window.location.origin}/tenant/${tenantId}/reports/${value}/public`
      await navigator.clipboard.writeText(url)
      Message.success(
        'Report URL successfully copied to your clipboard'
      )
    }
  }
}
</script>
