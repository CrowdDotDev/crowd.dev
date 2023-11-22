<template>
  <div
    v-if="loading || !currentTemplate"
    v-loading="loading"
    class="app-page-spinner"
  />
  <div v-else-if="!error" class="absolute left-0 right-0">
    <div
      ref="header"
      class="w-full bg-gray-50 border-gray-200 pt-4 sticky top-[-20px] z-10"
      :class="{
        'border-b': !isHeaderOnTop,
        shadow: isHeaderOnTop,
      }"
    >
      <div class="max-w-5xl mx-auto px-8 pb-6">
        <router-link
          class="btn-link--sm btn-link--secondary inline-flex items-center mb-3.5"
          :to="{ path: '/reports' }"
        >
          <i
            class="ri-arrow-left-s-line mr-2"
          />Reports
        </router-link>
        <div
          class="flex flex-grow items-center justify-between"
        >
          <h1 class="text-xl font-semibold">
            {{ currentTemplate.name }}
          </h1>
          <div class="flex items-center gap-9">
            <div class=" text-sm flex items-center gap-2">
              <i class="text-gray-500 ri-time-line text-base" />
              <span class="text-gray-500">Data on this page is refreshed every 15 min.</span>
            </div>
            <div
              v-if="report.public"
              class="flex items-center gap-2"
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
            />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <app-report-template-filters
        v-model:platform="platform"
        v-model:team-members="teamMembers"
        v-model:team-activities="teamActivities"
        :show-platform="currentTemplate.filters.platform"
        :show-team-members="
          currentTemplate.filters.teamMembers
        "
        :show-team-activities="currentTemplate.filters.teamActivities"
        @open="onPlatformFilterOpen"
        @reset="onPlatformFilterReset"
        @track-filters="onTrackFilters"
      />
    </div>
    <app-page-wrapper size="narrow">
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
            }"
          />
        </div>
      </div>
    </app-page-wrapper>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  defineProps,
  computed,
  onBeforeUnmount,
} from 'vue';
import { useStore } from 'vuex';
import AppReportShareButton from '@/modules/report/components/report-share-button.vue';
import templates from '@/modules/report/templates/config';
import AppReportTemplateFilters from '@/modules/report/components/templates/report-template-filters.vue';
import ActivityPlatformField from '@/modules/activity/activity-platform-field';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import { useQuickStartStore } from '@/modules/quickstart/store';

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
});

const { doFind } = mapActions('report');
const { getGuides } = useQuickStartStore();

const store = useStore();

const report = ref();
const header = ref();
const wrapper = ref();
const loading = ref();
const error = ref();
const storeUnsubscribe = ref(() => {});
const isHeaderOnTop = ref(false);

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

const platform = ref(initialPlatformValue);
const teamMembers = ref(false);
const teamActivities = ref(false);

const currentTemplate = computed(() => templates.find((t) => t.config.nameAsId === report.value?.name)?.config);

const { cubejsApi } = mapGetters('widget');
const { getCubeToken } = mapActions('widget');

const onPageScroll = () => {
  isHeaderOnTop.value = header.value.getBoundingClientRect().top === 0
    && wrapper.value.scrollTop !== 0;
};

const onPlatformFilterOpen = () => {
  platform.value = {
    ...platform.value,
    expanded: true,
  };
};

const onPlatformFilterReset = () => {
  platform.value = initialPlatformValue;
};

const onTrackFilters = () => {
  window.analytics.track('Filter template report', {
    template: currentTemplate.value.nameAsId,
    platforms: platform.value.value.map((p) => p.value),
    includeTeamMembers: teamMembers.value,
    includeTeamActivities: teamActivities.value,
  });
};

onMounted(async () => {
  storeUnsubscribe.value = store.subscribe((mutation) => {
    if (mutation.type === 'report/FIND_ERROR') {
      error.value = true;
    }
  });

  loading.value = true;
  report.value = await doFind(props.id);
  loading.value = false;
  getGuides();

  if (cubejsApi.value === null) {
    await getCubeToken();
  }

  wrapper.value = document.querySelector(
    '#main-page-wrapper',
  );

  wrapper.value?.addEventListener('scroll', onPageScroll);
});

onBeforeUnmount(() => {
  storeUnsubscribe.value();
});

onUnmounted(() => {
  wrapper.value?.removeEventListener('scroll', onPageScroll);
});
</script>
