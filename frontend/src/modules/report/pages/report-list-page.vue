<template>
  <app-page-wrapper>
    <div class="mb-12">
      <app-lf-page-header text-class="text-sm text-brand-500 mb-2.5" />
      <div class="flex items-center justify-between">
        <h4>Reports</h4>
        <el-button
          v-if="!!count"
          class="btn btn--primary btn--md"
          @click="isCreatingReport = true"
        >
          Add report
        </el-button>
      </div>
      <div class="text-xs text-gray-500">
        Build custom widgets, organize them in reports and
        share them publicly
      </div>
    </div>

    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    />
    <div v-else>
      <!-- Template reports -->
      <div v-if="computedTemplates.length">
        <div
          class="text-gray-900 font-semibold text-base mb-6"
        >
          Default reports
        </div>

        <div class="grid grid-cols-3 gap-5">
          <app-report-template-item
            v-for="template in computedTemplates"
            :key="template.name"
            :template="template"
          />
        </div>

        <el-divider
          v-if="customReportsCount"
          class="!mb-6 !mt-14 border-gray-200"
        />
      </div>

      <!-- Custom Reports -->
      <div v-if="customReportsCount">
        <div
          class="text-gray-900 font-semibold text-base mb-6"
        >
          Custom reports
        </div>
        <app-report-list-table
          @cta-click="isCreatingReport = true"
        />
      </div>
      <app-report-create-dialog
        v-model="isCreatingReport"
      />
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import ReportListTable from '@/modules/report/components/report-list-table.vue';
import AppReportCreateDialog from '@/modules/report/components/report-create-dialog.vue';
import { ReportPermissions } from '@/modules/report/report-permissions';
import AppReportTemplateItem from '@/modules/report/components/templates/report-template-item.vue';
import templates from '@/modules/report/templates/config';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';

export default {
  name: 'AppReportListPage',

  components: {
    AppReportCreateDialog,
    AppReportTemplateItem,
    'app-report-list-table': ReportListTable,
    AppLfPageHeader,
  },

  data() {
    return {
      isCreatingReport: false,
      templates,
    };
  },

  computed: {
    ...mapState({
      count: (state) => state.report.count,
      loading: (state) => state.report.list.loading,
    }),
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
      rows: 'report/rows',
    }),
    hasPermissionToCreate() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser,
      ).create;
    },
    computedTemplates() {
      if (this.loading) {
        return [];
      }

      const templateRows = this.rows.filter(
        (r) => r.isTemplate,
      );

      // List all templates that exist in the backend
      // (have an id)
      return this.templates.map((t) => {
        const rowTemplate = templateRows.find(
          (r) => r.name === t.config.nameAsId,
        );
        return {
          ...t.config,
          public: rowTemplate?.public || false,
          id: rowTemplate?.id,
        };
      }).filter((t) => !!t.id);
    },
    customReportsCount() {
      return this.count - this.computedTemplates.length;
    },
  },

  created() {
    this.doFetch({
      keepPagination: true,
    });
  },

  async mounted() {
    window.analytics.page('Reports');
  },

  methods: {
    ...mapActions({
      doFetch: 'report/doFetch',
    }),
  },
};
</script>

<style></style>
