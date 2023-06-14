<template>
  <div v-if="isReadOnly">
    <el-button
      class="btn btn--secondary"
      @click="copyToClipboard(report.id)"
    >
      <i class="ri-lg ri-clipboard-line mr-1" />
      Copy Public Url
    </el-button>
  </div>
  <div v-else>
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
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <el-dropdown-item
          v-if="showViewReport"
          :command="{
            action: 'reportView',
            report: report,
          }"
        >
          <i class="ri-eye-line mr-1" />View
          Report
        </el-dropdown-item>
        <el-dropdown-item
          v-if="showEditReport"
          :command="{
            action: 'reportEdit',
            report: report,
          }"
        >
          <i class="ri-pencil-line mr-1" />Edit
          Report
        </el-dropdown-item>
        <el-dropdown-item
          v-if="report.public && showViewReportPublic"
          :command="{
            action: 'reportPublicUrl',
            report: report,
          }"
        >
          <i class="ri-link mr-1" />Copy Public
          Url
        </el-dropdown-item>
        <el-dropdown-item
          v-if="showDuplicateReport"
          :command="{
            action: 'reportDuplicate',
            report: report,
          }"
        >
          <i class="ri-file-copy-line mr-1" />Duplicate
          Report
        </el-dropdown-item>
        <el-divider
          v-if="showEditReport || showViewReportPublic"
          class="border-gray-200 !my-2"
        />
        <el-dropdown-item
          :command="{
            action: 'reportDelete',
            report: report,
          }"
        >
          <i
            class="ri-delete-bin-line text-base mr-2 text-red-500"
          /><span class="text-xs text-red-500">Delete Report</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import Message from '@/shared/message/message';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { ReportPermissions } from '@/modules/report/report-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { ReportService } from '@/modules/report/report-service';

export default {
  name: 'AppReportDropdown',
  props: {
    report: {
      type: Object,
      default: () => {},
    },
    showViewReport: {
      type: Boolean,
      default: true,
    },
    showEditReport: {
      type: Boolean,
      default: true,
    },
    showViewReportPublic: {
      type: Boolean,
      default: true,
    },
    showDuplicateReport: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
    }),
    isReadOnly() {
      return (
        new ReportPermissions(
          this.currentTenant,
          this.currentUser,
        ).edit === false
      );
    },
  },
  methods: {
    ...mapActions({
      doDestroy: 'report/doDestroy',
      doCreate: 'report/doCreate',
    }),
    async doDestroyWithConfirm(id) {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete report',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line',
        });

        return this.doDestroy(id);
      } catch (error) {
        // no
      }
      return null;
    },
    async doDuplicate(id, segmentId) {
      ReportService.duplicate(id, [segmentId])
        .then((duplicate) => {
          this.$router.push({
            name: 'reportEdit',
            params: {
              id: duplicate.id,
              segmentId: duplicate.segmentId,
            },
          });
          Message.success('Report duplicated successfuly');
        })
        .catch(() => {
          Message.error('Error duplicating report');
        });
    },
    handleCommand(command) {
      if (command.action === 'reportDelete') {
        return this.doDestroyWithConfirm(
          command.report.id,
        );
      } if (command.action === 'reportDuplicate') {
        return this.doDuplicate(command.report.id, command.report.segmentId);
      } if (command.action === 'reportPublicUrl') {
        return this.copyToClipboard(command.report.id);
      }
      return this.$router.push({
        name: command.action,
        params: {
          id: command.report.id,
          segmentId: command.report.segmentId,
        },
      });
    },
    async copyToClipboard(value) {
      const tenantId = AuthCurrentTenant.get();
      const url = `${window.location.origin}/tenant/${tenantId}/reports/${value}/public`;
      await navigator.clipboard.writeText(url);
      Message.success(
        'Report URL successfully copied to your clipboard',
      );
    },
  },
};
</script>
