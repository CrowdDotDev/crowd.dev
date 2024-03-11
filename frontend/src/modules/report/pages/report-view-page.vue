<template>
  <div
    v-if="computedLoading"
    v-loading="computedLoading"
    class="app-page-spinner"
  />
  <div v-else-if="!error" class="absolute left-0 right-0 top-0">
    <div
      class="mb-4 flex items-center flex-shrink-0 sticky top-[-20px] inset-x-0 z-10
        transition-all ease-in-out duration-300 justify-center border-gray-200 bg-white border-b rounded-tl-2xl pt-4 w-full pb-4"
      :class="{
        shadow: !isHeaderOnTop,
      }"
      :style="'left: 280px'"
    >
      <div class="max-w-5xl mx-5 w-full">
        <router-link
          class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center mb-2"
          :to="{
            path: '/reports',
            query: { projectGroup: selectedProjectGroup?.id },
          }"
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
              :segment-id="report.segmentId"
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
        class="-mx-4 pb-24"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import ReportShareButton from '@/modules/report/components/report-share-button.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
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
    segmentId: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      loading: false,
      error: false,
      wrapper: null,
      isHeaderOnTop: true,
      storeUnsubscribe: () => {},
    };
  },

  computed: {
    ...mapState({
      reportLoading: 'report/loading',
    }),
    ...mapGetters({
      reportFind: 'report/find',
    }),
    report() {
      return this.reportFind(this.id);
    },
    computedLoading() {
      return this.reportLoading || this.loading;
    },
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();

      return storeToRefs(lsSegmentsStore).selectedProjectGroup.value;
    },
  },

  async created() {
    this.loading = true;

    await this.getCubeToken();

    if (this.tenantId) {
      await AuthCurrentTenant.set({ id: this.tenantId });
      await this.doFindPublic({
        id: this.id,
        tenantId: this.tenantId,
        excludeSegments: !this.segmentId,
        segments: [this.segmentId],
      });
    } else {
      await this.doFind({
        id: this.id,
        segments: this.segmentId ? [this.segmentId] : undefined,
      });
    }
    this.loading = false;
  },

  mounted() {
    this.storeUnsubscribe = this.$store.subscribe(
      (mutation) => {
        if (mutation.type === 'report/FIND_ERROR') {
          this.error = true;
        }
      },
    );

    this.wrapper = document.querySelector(
      '#main-page-wrapper',
    );

    this.wrapper?.addEventListener('scroll', this.onPageScroll);
  },
  beforeUnmount() {
    this.storeUnsubscribe();
  },
  unmounted() {
    this.wrapper?.removeEventListener('scroll', this.onPageScroll);
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind',
      doFindPublic: 'report/doFindPublic',
      getCubeToken: 'widget/getCubeToken',
    }),
    onPageScroll() {
      this.isHeaderOnTop = this.wrapper.scrollTop === 0;
    },
  },
};
</script>

<style lang="scss">
.report-view-page {
  @apply relative h-screen;
}
</style>
