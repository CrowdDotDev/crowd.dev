<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="handleCommand"
  >
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
    </template>
  </el-dropdown>
</template>

<script>
import Message from '@/shared/message/message'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export default {
  name: 'AppReportTemplateDropdown',
  props: {
    report: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    async handleCommand(command) {
      if (command.action === 'reportPublicUrl') {
        return await this.copyToClipboard(command.report.id)
      }
    },
    async copyToClipboard(value) {
      const tenantId = AuthCurrentTenant.get(true)
      const url = `${window.location.origin}/tenant/${tenantId}/reports/${value}/public`
      await navigator.clipboard.writeText(url)
      Message.success(
        'Report URL successfully copied to your clipboard'
      )
    }
  }
}
</script>
