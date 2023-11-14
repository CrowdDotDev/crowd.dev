<template>
  <div class="report-view-page">
    <div
      v-if="computedLoading"
      v-loading="computedLoading"
      class="app-page-spinner"
    />
    <div v-else-if="!error">
      <div
        class="mb-4 h-24 flex items-center flex-shrink-0 fixed top-0 inset-x-0 z-10 bg-gray-50
        shadow-sm transition-all ease-in-out duration-300 justify-center"
        :style="
          menuCollapsed ? 'left: 64px' : 'left: 260px'
        "
      >
        <div class="max-w-5xl mx-5 w-full">
          <router-link
            class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center mb-2"
            :to="{ path: '/reports' }"
          >
            <i class="ri-arrow-left-s-line mr-2" />Reports
          </router-link>
          <div
            class="flex flex-grow items-center justify-between"
          >
            <h1 class="text-lg font-semibold">
              {{ report.name }}
            </h1>
            <div v-if="!tenantId" class="flex items-center">
              <div
                v-if="report.public"
                class="flex items-center gap-2 mr-9"
              >
                <i
                  class="ri-global-line text-base text-green-600"
                />
                <div
                  class="text-sm text-green-600 font-medium"
                >
                  Public
                </div>
              </div>
              <app-report-share-button
                :id="id"
                v-model="report.public"
                class="mr-4"
              />
              <app-report-dropdown
                :report="report"
                :show-edit-report="true"
                :show-view-report="false"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="max-w-5xl flex flex-grow mx-auto">
        <app-report-grid-layout
          v-model="report"
          class="-mx-4 pt-24 pb-24"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import ReportShareButton from '@/modules/report/components/report-share-button.vue';
import { useQuickStartStore } from '@/modules/quickstart/store';
import { mapActions as piniaMapActions } from 'pinia';
import ReportGridLayout from '../components/report-grid-layout.vue';
import ReportDropdown from '../components/report-dropdown.vue';

export default {
  name: 'AppReportViewPage',

  components: {
    'app-report-share-button': ReportShareButton,
    'app-report-grid-layout': ReportGridLayout,
    'app-report-dropdown': ReportDropdown,
  },

  props: {
    id: {
      type: String,
      default: null,
    },
    tenantId: {
      type: String,
      default: null,
    },
  },

  setup() {

  },

  data() {
    return {
      loading: false,
      error: false,
      storeUnsubscribe: () => {},
    };
  },

  computed: {
    ...mapState({
      reportLoading: 'report/loading',
    }),
    ...mapGetters({
      menuCollapsed: 'layout/menuCollapsed',
      reportFind: 'report/find',
    }),
    report() {
      return this.reportFind(this.id);
    },
    computedLoading() {
      return this.reportLoading || this.loading;
    },
  },

  async created() {
    this.loading = true;
    if (this.tenantId) {
      await AuthCurrentTenant.set({ id: this.tenantId });
      await this.doFindPublic({
        id: this.id,
        tenantId: this.tenantId,
      });
    } else {
      await this.doFind(this.id);
    }
    this.loading = false;
    this.getGuides();
  },

  mounted() {
    this.storeUnsubscribe = this.$store.subscribe(
      (mutation) => {
        if (mutation.type === 'report/FIND_ERROR') {
          this.error = true;
        }
      },
    );
  },
  beforeUnmount() {
    this.storeUnsubscribe();
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind',
      doFindPublic: 'report/doFindPublic',
    }),
    ...piniaMapActions(useQuickStartStore, {
      getGuides: 'getGuides',
    }),
  },
};
</script>

<style lang="scss">
.report-view-page {
  @apply relative h-screen;
}
</style>
