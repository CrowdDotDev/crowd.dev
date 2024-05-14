<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-page-toolbar report-list-toolbar"
  >
    <span class="block text-sm font-semibold mr-4">{{ selectedRows.length }}
      {{ selectedRows.length > 1 ? 'reports' : 'report' }}
      selected</span>

    <el-tooltip
      v-if="hasPermission(LfPermission.reportDestroy)"
      :content="destroyButtonTooltip"
      :disabled="!destroyButtonTooltip"
    >
      <span>
        <el-button
          :disabled="destroyButtonDisabled"
          class="btn btn--secondary mr-2"
          @click="doDestroyAllWithConfirm"
        >
          <i class="ri-lg ri-delete-bin-line mr-1" />
          <app-i18n code="common.destroy" />
        </el-button>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import { i18n } from '@/i18n';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';

export default {
  name: 'AppReportListToolbar',
  setup() {
    const authStore = useAuthStore();
    const { user, tenant } = storeToRefs(authStore);

    const { hasPermission } = usePermissions();
    return { user, tenant, hasPermission };
  },
  computed: {
    LfPermission() {
      return LfPermission;
    },
    ...mapState({
      loading: (state) => state.report.loading,
    }),
    ...mapGetters({
      hasRows: 'report/hasRows',
      selectedRows: 'report/selectedRows',
    }),

    destroyButtonDisabled() {
      return !this.selectedRows.length || this.loading;
    },

    destroyButtonTooltip() {
      if (this.destroyButtonDisabled) {
        return i18n('common.mustSelectARow');
      }

      return null;
    },
  },

  methods: {
    ...mapActions({
      doDestroyAll: 'report/doDestroyAll',
    }),

    async doDestroyAllWithConfirm() {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete reports',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line',
        });

        return this.doDestroyAll(
          this.selectedRows.map((item) => item.id),
        );
      } catch (error) {
        // no
      }
      return null;
    },
  },
};
</script>

<style lang="scss">
.report-list-toolbar {
  @apply flex items-center justify-start absolute top-0 right-0 z-10 bg-white rounded-tr-xl p-2;
  height: calc(56px - 1px);
  width: calc(100% - 75px);
}
</style>
