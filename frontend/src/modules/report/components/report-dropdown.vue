<template>
  <div v-if="isReadOnly">
    <el-button
      class="btn btn--secondary"
      placement="bottom-end"
      @click="copyToClipboard(report.id)"
    >
      <i class="ri-lg ri-clipboard-line mr-1" />
      Copy Public Url
    </el-button>
  </div>
  <div v-else>
    <el-dropdown trigger="click" @command="handleCommand">
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item
          v-if="report.public"
          :command="{
            action: 'reportPublicUrl',
            report: report
          }"
          ><i class="ri-link mr-1"></i>Copy Public
          Url</el-dropdown-item
        >
        <el-dropdown-item
          v-if="showViewReport"
          :command="{
            action: 'reportView',
            report: report
          }"
          ><i class="ri-eye-line mr-1" />View
          Report</el-dropdown-item
        >
        <el-dropdown-item
          :command="{
            action: 'reportEdit',
            report: report
          }"
          ><i class="ri-pencil-line mr-1" />Edit
          Report</el-dropdown-item
        >
        <el-divider class="border-gray-200" />
        <el-dropdown-item
          :command="{
            action: 'reportDelete',
            report: report
          }"
          ><i
            class="ri-delete-bin-line text-base mr-2 text-red-500"
          /><span class="text-xs text-red-500"
            >Delete Report</span
          ></el-dropdown-item
        >
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import Message from '@/shared/message/message'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { ReportPermissions } from '@/modules/report/report-permissions'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

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
        await ConfirmDialog({
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
        })

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
