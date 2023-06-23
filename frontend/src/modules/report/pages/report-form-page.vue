<template>
  <app-page-wrapper size="narrow">
    <div
      v-if="loading.find"
      v-loading="loading.find"
      class="app-page-spinner"
    />
    <div v-else>
      <div class="flex items-center justify-between">
        <router-link
          class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
          :to="{ path: '/reports' }"
        >
          <i class="ri-arrow-left-s-line mr-2" />Reports
        </router-link>
        <div class="flex items-center">
          <router-link
            class="btn btn--transparent btn--md mr-4"
            :to="{
              name: 'reportView',
              params: {
                id,
                segmentId,
              },
            }"
          >
            <i class="ri-eye-line mr-2" />View
            report
          </router-link>
          <app-report-dropdown
            :report="record"
            :show-view-report="false"
            :show-view-report-public="false"
            :show-edit-report="false"
            :show-duplicate-report="false"
          />
        </div>
      </div>
      <app-report-form
        v-if="!loading.find"
        :record="record"
      />
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import AppReportForm from '@/modules/report/components/report-form.vue';
import AppReportDropdown from '@/modules/report/components/report-dropdown.vue';

export default {
  name: 'AppReportFormPage',

  components: {
    AppReportForm,
    AppReportDropdown,
  },

  props: {
    id: {
      type: String,
      default: null,
    },
    segmentId: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      loading: {
        find: false,
        submit: false,
      },
      isPublic: false,
    };
  },

  computed: {
    ...mapGetters('report', ['find']),
    record() {
      return this.find(this.id);
    },
  },

  async created() {
    this.loading.find = true;

    await this.doFind({
      id: this.id,
      segments: [this.segmentId],
    });

    this.isPublic = this.record.public;
    this.loading.find = false;
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind',
      doCreate: 'report/doCreate',
    }),

    doCancel() {
      this.$router.push('/reports');
    },
  },
};
</script>

<style lang="scss">
.report-form-page {
  .el-form-item {
    display: block;

    &__content {
      display: block;
    }
  }
}
</style>
