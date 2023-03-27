<template>
  <div
    v-if="loading"
    v-loading="loading"
    class="app-page-spinner"
  ></div>
  <div v-else-if="!error" class="absolute left-0 right-0">
    <div
      ref="header"
      class="w-full bg-gray-50 border-gray-200 pt-4 sticky top-[-20px] z-10"
      :class="{
        'border-b': !isHeaderOnTop,
        shadow: isHeaderOnTop
      }"
    >
      <div class="max-w-5xl mx-auto px-8 pb-6">
        <router-link
          class="btn-link--sm btn-link--secondary inline-flex items-center mb-3.5"
          :to="{ path: '/reports' }"
        >
          <i
            class="ri-arrow-left-s-line mr-2"
          />Reports</router-link
        >
        <div
          class="flex flex-grow items-center justify-between"
        >
          <h1 class="text-xl font-semibold">
            {{ currentTemplate.name }}
          </h1>
          <div class="flex items-center gap-9">
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
        :show-platform="currentTemplate.filters.platform"
        :show-team-members="
          currentTemplate.filters.teamMembers
        "
        @open="onPlatformFilterOpen"
        @reset="onPlatformFilterReset"
        @track-filters="onTrackFilters"
      />
    </div>
    <app-page-wrapper size="narrow">
      <div class="w-full mt-8">
        <app-report-member-template
          v-if="
            currentTemplate.nameAsId ===
            MEMBERS_REPORT.nameAsId
          "
          :filters="{
            platform,
            teamMembers
          }"
        />
        <app-report-product-community-fit-template
          v-if="
            currentTemplate.nameAsId ===
            PRODUCT_COMMUNITY_FIT_REPORT.nameAsId
          "
          :filters="{
            teamMembers
          }"
        />
      </div>
    </app-page-wrapper>
  </div>
</template>

<script setup>
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import {
  ref,
  onMounted,
  onUnmounted,
  defineProps,
  computed,
  onBeforeUnmount
} from 'vue'
import AppReportMemberTemplate from './report-member-template.vue'
import AppReportProductCommunityFitTemplate from './report-product-community-fit-template.vue'
import AppReportShareButton from '@/modules/report/components/report-share-button.vue'
import {
  MEMBERS_REPORT,
  PRODUCT_COMMUNITY_FIT_REPORT,
  templates
} from '@/modules/report/templates/template-reports'
import AppReportTemplateFilters from '@/modules/report/components/templates/report-template-filters.vue'
import ActivityPlatformField from '@/modules/activity/activity-platform-field'
import { useStore } from 'vuex'

const props = defineProps({
  id: {
    type: String,
    default: null
  }
})

const { doFind } = mapActions('report')

const store = useStore()

const report = ref()
const header = ref()
const wrapper = ref()
const loading = ref()
const error = ref()
const storeUnsubscribe = ref(() => {})
const isHeaderOnTop = ref(false)

const platformField = new ActivityPlatformField(
  'activeOn',
  'Platforms',
  { filterable: true }
).forFilter()

const initialPlatformValue = {
  ...platformField,
  expanded: false
}

const platform = ref(initialPlatformValue)
const teamMembers = ref(false)

const currentTemplate = computed(() =>
  templates.find((t) => t.nameAsId === report.value.name)
)

const { cubejsApi } = mapGetters('widget')
const { getCubeToken } = mapActions('widget')

onMounted(async () => {
  storeUnsubscribe.value = store.subscribe((mutation) => {
    if (mutation.type === 'report/FIND_ERROR') {
      error.value = true
    }
  })

  loading.value = true
  report.value = await doFind(props.id)
  loading.value = false

  if (cubejsApi.value === null) {
    await getCubeToken()
  }

  wrapper.value = document.querySelector(
    '#main-page-wrapper'
  )

  wrapper.value?.addEventListener('scroll', onPageScroll)
})

onBeforeUnmount(() => {
  storeUnsubscribe.value()
})

onUnmounted(() => {
  wrapper.value?.removeEventListener('scroll', onPageScroll)
})

const onPageScroll = () => {
  isHeaderOnTop.value =
    header.value.getBoundingClientRect().top === 0 &&
    wrapper.value.scrollTop !== 0
}

const onPlatformFilterOpen = () => {
  platform.value = {
    ...platform.value,
    expanded: true
  }
}

const onPlatformFilterReset = () => {
  platform.value = initialPlatformValue
}

const onTrackFilters = () => {
  window.analytics.track('Filter template report', {
    template: currentTemplate.value.nameAsId,
    platforms: platform.value.value.map((p) => p.value),
    includeTeamMembers: teamMembers.value
  })
}
</script>
