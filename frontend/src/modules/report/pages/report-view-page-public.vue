<template>
  <div ref="wrapper" class="report-view-page overflow-auto">
    <div
      v-if="computedLoading"
      v-loading="computedLoading"
      class="app-page-spinner"
    />
    <div v-else>
      <div
        ref="header"
        class="mb-4 sticky top-0 inset-x-0 z-10 bg-white"
        :class="{
          'border-b': !isHeaderOnTop,
          shadow: isHeaderOnTop,
        }"
      >
        <div
          class="max-w-5xl flex flex-grow mx-auto items-center justify-between px-6 lg:px-8"
        >
          <div class="mb-6 mt-4 w-full">
            <div
              v-if="currentTenant.name"
              class="font-medium text-brand-500 text-sm mb-2"
            >
              {{ currentTenant.name }}
            </div>
            <div class="flex items-center justify-between">
              <h1 class="text-lg font-semibold">
                {{
                  report.isTemplate
                    ? currentTemplate.name
                    : report.name
                }}
              </h1>
              <div class=" text-sm flex items-center gap-2">
                <i class="text-gray-500 ri-time-line text-base" />
                <span class="text-gray-500">Data on this page is refreshed every 15 min.</span>
              </div>
            </div>
          </div>

          <div
            v-if="!tenantId && !report.isTemplate"
            class="flex items-center"
          >
            <span
              class="badge mr-4"
              :class="report.public ? 'badge--green' : ''"
            >{{
              report.public ? 'Public' : 'Private'
            }}</span>
            <router-link
              class="btn btn-link btn-link--sm btn-link--primary"
              :to="{
                name: 'reportEdit',
                params: {
                  id,
                  segmentId: report.segmentId,
                },
                query: { projectGroup: selectedProjectGroup?.id },
              }"
            >
              <i class="ri-pencil-line mr-2" />Edit
            </router-link>
          </div>
        </div>

        <!-- Filters -->
        <app-report-template-filters
          v-if="report.isTemplate"
          v-model:platform="platform"
          v-model:segments="segments"
          v-model:team-members="teamMembers"
          v-model:team-activities="teamActivities"
          :show-platform="currentTemplate.filters?.platform"
          :show-team-members="
            currentTemplate.filters?.teamMembers
          "
          :show-team-activities="currentTemplate.filters?.teamActivities"
          @open="onPlatformFilterOpen"
          @reset="onPlatformFilterReset"
          @track-filters="onTrackFilters"
        />
      </div>
      <!-- Template report -->
      <app-page-wrapper
        v-if="report.isTemplate"
        size="narrow"
      >
        <div class="w-full mt-8">
          <div
            v-for="template in templates"
            :key="template.config.nameAsId"
          >
            <component
              :is="template.component"
              v-if="
                currentTemplate.nameAsId
                  === template.config.nameAsId
              "
              :filters="{
                platform,
                teamMembers,
                teamActivities,
                segments,
              }"
            />
          </div>
        </div>
      </app-page-wrapper>
      <!-- Custom Report -->
      <div v-else class="max-w-5xl flex flex-grow mx-auto">
        <app-report-grid-layout
          v-model="report"
          :is-public-view="true"
          class="-mx-4 pt-20 pb-24"
        />
      </div>
      <div
        v-if="tenantId"
        class="w-full text-gray-400 text-xs flex items-center leading-none"
      >
        <div
          class="max-w-5xl flex flex-grow mx-auto items-center justify-between px-6 lg:px-8 mb-8"
        >
          <div class="flex items-center">
            <a
              href="https://www.crowd.dev/privacy-policy"
              class="text-gray-400 hover:text-brand-500"
              target="_blank"
              rel="noopener noreferrer"
            >Privacy Policy</a>
            <span class="mx-1"> · </span>
            <a
              href="https://www.crowd.dev/terms-of-use"
              class="text-gray-400 hover:text-brand-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Use
            </a>
            <span class="mx-1"> · </span>
            <a
              href="https://www.crowd.dev/imprint"
              class="text-gray-400 hover:text-brand-500 mr-8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Imprint
            </a>
          </div>
          <div>
            © Crowd&nbsp;Technologies GmbH
            {{ new Date().getFullYear() }}. All rights
            reserved.
          </div>
        </div>
      </div>
      <div
        class="fixed right-6 flex items-center gap-2 bg-black rounded-full px-3 h-8 bottom-btn"
      >
        <div class="text-gray-300 text-2xs">
          Powered by
        </div>
        <a href="https://www.crowd.dev/" target="_blank" rel="noopener noreferrer">
          <img
            src="/images/logo/crowd-white.svg"
            class="block h-3.5 mb-1"
            alt="logo crowd.dev"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import ReportGridLayout from '@/modules/report/components/report-grid-layout.vue';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { TenantService } from '@/modules/tenant/tenant-service';
import AppReportTemplateFilters from '@/modules/report/components/templates/report-template-filters.vue';
import ActivityPlatformField from '@/modules/activity/activity-platform-field';
import MEMBERS_REPORT from '@/modules/report/templates/config/members';
import PRODUCT_COMMUNITY_FIT_REPORT from '@/modules/report/templates/config/productCommunityFit';
import ACTIVITIES_REPORT from '@/modules/report/templates/config/activities';
import templates from '@/modules/report/templates/config';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const platformField = new ActivityPlatformField(
  'activeOn',
  'Platforms',
  { filterable: true },
).forFilter();

const initialPlatformValue = {
  ...platformField,
  custom: true,
  expanded: false,
};

export default {
  name: 'AppReportViewPage',

  components: {
    'app-report-grid-layout': ReportGridLayout,
    AppReportTemplateFilters,
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
      currentTenant: null,
      platform: initialPlatformValue,
      teamMembers: false,
      teamActivities: false,
      segments: {
        segments: [],
        childSegments: [],
      },
      isHeaderOnTop: false,
      templates,
      MEMBERS_REPORT,
      PRODUCT_COMMUNITY_FIT_REPORT,
      ACTIVITIES_REPORT,
    };
  },

  computed: {
    ...mapState({
      reportLoading: 'report/loading',
    }),
    ...mapGetters({
      reportFind: 'report/find',
      cubejsApi: 'widget/cubejsApi',
    }),
    report() {
      return this.reportFind(this.id);
    },
    computedLoading() {
      return this.reportLoading || this.loading;
    },
    currentTemplate() {
      return this.templates.find(
        (t) => t.config.nameAsId === this.report.name,
      )?.config;
    },
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();

      return storeToRefs(lsSegmentsStore).selectedProjectGroup.value;
    },
  },

  mounted() {
    if (this.$refs.wrapper) {
      this.$refs.wrapper.addEventListener(
        'scroll',
        this.onPageScroll,
      );
    }
  },

  unmounted() {
    this.$refs.wrapper?.removeEventListener(
      'scroll',
      this.onPageScroll,
    );
  },

  async created() {
    this.loading = true;
    if (this.tenantId) {
      await AuthCurrentTenant.set({ id: this.tenantId });
      await this.doFindPublic({
        id: this.id,
        tenantId: this.tenantId,
        excludeSegments: !this.segmentId,
        segments: [this.segmentId],
      });
      this.currentTenant = await TenantService.find(
        this.tenantId,
      );
    } else {
      await this.doFind({
        id: this.id,
        segments: this.segmentId ? [this.segmentId] : undefined,
      });
    }

    if (!this.cubejsApi) {
      await this.getCubeToken();
    }

    this.loading = false;
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind',
      doFindPublic: 'report/doFindPublic',
      getCubeToken: 'widget/getCubeToken',
    }),
    onPlatformFilterOpen() {
      this.platform = {
        ...this.platform,
        expanded: true,
      };
    },
    onPlatformFilterReset() {
      this.platform = initialPlatformValue;
    },
    onTrackFilters() {
      window.analytics.track('Filter template report', {
        template: this.currentTemplate.nameAsId,
        public: true,
        platforms: this.platform.value.map((p) => p.value),
        includeTeamMembers: this.teamMembers,
        includeTeamActivities: this.teamActivities,
      });
    },
    onPageScroll() {
      this.isHeaderOnTop = this.$refs.header?.getBoundingClientRect().top
          === 0 && this.$refs.wrapper?.scrollTop !== 0;
    },
  },
};
</script>

<style lang="scss">
.report-view-page {
  @apply relative h-screen;
}

@media (max-width: 1362px) {
  .bottom-btn {
    @apply bottom-16;
  }
}

@media (min-width: 1362px) {
  .bottom-btn {
    @apply bottom-6;
  }
}
</style>
