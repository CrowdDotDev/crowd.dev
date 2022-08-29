<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-page-toolbar report-list-toolbar"
  >
    <span class="block text-sm font-semibold mr-4"
      >{{ selectedRows.length }}
      {{ selectedRows.length > 1 ? 'rows' : 'row' }}
      selected</span
    >

    <el-tooltip
      v-if="hasPermissionToDestroy"
      :content="destroyButtonTooltip"
      :disabled="!destroyButtonTooltip"
    >
      <span>
        <el-button
          :disabled="destroyButtonDisabled"
          icon="ri-lg ri-delete-bin-line"
          class="btn btn--secondary mr-2"
          @click="doDestroyAllWithConfirm"
        >
          <app-i18n code="common.destroy"></app-i18n>
        </el-button>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { ReportPermissions } from '@/modules/report/report-permissions'
import { i18n } from '@/i18n'

export default {
  name: 'AppReportListToolbar',

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'report/hasRows',
      loading: 'report/loading',
      selectedRows: 'report/selectedRows'
    }),

    hasPermissionToDestroy() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    destroyButtonDisabled() {
      return (
        !this.selectedRows.length ||
        this.loading('submit') ||
        this.loading('table')
      )
    },

    destroyButtonTooltip() {
      if (this.destroyButtonDisabled) {
        return i18n('common.mustSelectARow')
      }

      return null
    }
  },

  methods: {
    ...mapActions({
      doDestroyAll: 'report/doDestroyAll'
    }),

    async doDestroyAllWithConfirm() {
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

        return this.doDestroyAll(
          this.selectedRows.map((item) => item.id)
        )
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style lang="scss">
.report-list-toolbar {
  @apply flex items-center justify-end absolute h-16 top-0 mt-1 right-0 z-10 bg-white rounded-tr-xl p-2;
  width: calc(100% - 75px);
}
</style>
