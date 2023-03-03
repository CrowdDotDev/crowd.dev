<template>
  <div
    v-if="
      minCommunitySize >= 5000 &&
      notcompletedGuides.length > 0 &&
      !onboardingGuidesDismissed
    "
    class="panel !p-0 !rounded-lg"
    v-bind="$attrs"
  >
    <header class="bg-purple-50 p-4 relative">
      <div class="flex justify-between items-center">
        <i
          class="ri-lightbulb-line text-lg text-purple-800"
        ></i>
        <el-tooltip
          content="Dismiss guide"
          placement="top-end"
        >
          <div
            class="cursor-pointer"
            @click="dismissGuides()"
          >
            <i
              class="ri-close-fill text-lg text-gray-400"
            ></i>
          </div>
        </el-tooltip>
      </div>
      <div class="pb-4.5"></div>
      <p
        class="text-2xs text-purple-800 font-semibold uppercase"
      >
        QUICKSTART GUIDE
      </p>
    </header>
    <section class="pb-1 px-4">
      <app-dashboard-guide-item
        v-for="guide of guides"
        :key="guide.key"
        :guide="guide"
        :active="activeView === guide.key"
        @header-click="
          activeView =
            activeView !== guide.key ? guide.key : null
        "
        @open="selectedGuide = guide"
      />
    </section>
  </div>
  <app-dashboard-guide-modal v-model="selectedGuide" />
  <app-dashboard-guide-eagle-eye-modal
    v-model="eagleEyeModalOpened"
  />
</template>

<script>
export default {
  name: 'AppDashboardGuides'
}
</script>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppDashboardGuideItem from '@/modules/dashboard/components/guide/dashboard-guide-item.vue'
import AppDashboardGuideModal from '@/modules/dashboard/components/guide/dashboard-guide-modal.vue'
import * as loom from '@loomhq/loom-embed'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import AppDashboardGuideEagleEyeModal from '@/modules/dashboard/components/guide/dashboard-guide-eagle-eye-modal.vue'
import { QuickstartGuideService } from '@/modules/dashboard/services/quickstart-guide.service'

const { currentTenant, currentTenantUser } =
  mapGetters('auth')
const guides = ref([])
const activeView = ref(null)
const selectedGuide = ref(null)
const eagleEyeModalOpened = ref(false)
const onboardingGuidesDismissed = ref(false)

const notcompletedGuides = computed(() =>
  guides.value.filter((g) => !g.completed)
)
const minCommunitySize = computed(() => {
  // If community size bigger than 5000
  const [min] = currentTenant.value.communitySize
    .split(/[><-]/g)
    .filter((sub) => sub.length > 0)
    .map((el) => +el)
  return min
})

const getGuides = () => {
  return QuickstartGuideService.fetch().then((guides) => {
    return Promise.all(
      Object.entries(guides).map(([key, el]) => {
        try {
          return loom
            .oembed(el.videoLink)
            .then((video) => ({
              ...el,
              key,
              loomThumbnailUrl: video.thumbnail_url,
              loomHtml: video.html
            }))
        } catch (error) {
          return Promise.resolve({
            ...el,
            key
          })
        }
      })
    )
  })
}

const dismissGuides = () => {
  ConfirmDialog({
    type: 'info',
    title:
      'Do you really want to dismiss our Quickstart Guide?',
    message:
      'Users that follow our Quickstart Guide are 73% more likely to successfully set-up crowd.dev.',
    icon: 'ri-information-line',
    confirmButtonText: 'Dismiss quickstart guide',
    cancelButtonText: 'Cancel'
  }).then(() => {
    onboardingGuidesDismissed.value = true
    return QuickstartGuideService.updateSettings({
      isQuickstartGuideDismissed: true
    })
  })
}

onMounted(async () => {
  // Check if it can open eagle eye onboarding modal
  const {
    isEagleEyeGuideDismissed,
    isQuickstartGuideDismissed
  } = currentTenantUser.value.settings
  if (
    minCommunitySize.value < 5000 &&
    !isEagleEyeGuideDismissed
  ) {
    eagleEyeModalOpened.value = true
  }

  // Check if onboarding guides dismissed
  onboardingGuidesDismissed.value =
    isQuickstartGuideDismissed
  if (
    !onboardingGuidesDismissed.value &&
    minCommunitySize.value >= 5000
  ) {
    getGuides().then((guideList) => {
      guides.value = guideList
      activeView.value = notcompletedGuides.value?.length
        ? notcompletedGuides.value[0].key
        : null
    })
  }
})
</script>
