<template>
  <div
    v-if="
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
      <el-collapse v-model="activeView" accordion>
        <el-collapse-item
          v-for="guide of guides"
          :key="guide.key"
          :title="guide.title"
          :name="guide.key"
        >
          <app-dashboard-guide-item :guide="guide" />
        </el-collapse-item>
      </el-collapse>
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
import { ref, computed, onMounted, watch } from 'vue'
import AppDashboardGuideItem from '@/modules/dashboard/components/guide/dashboard-guide-item.vue'
import AppDashboardGuideModal from '@/modules/dashboard/components/guide/dashboard-guide-modal.vue'
import {
  mapActions,
  mapGetters
} from '@/shared/vuex/vuex.helpers'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import AppDashboardGuideEagleEyeModal from '@/modules/dashboard/components/guide/dashboard-guide-eagle-eye-modal.vue'
import { QuickstartGuideService } from '@/modules/quickstart-guide/services/quickstart-guide.service'

const { currentTenant, currentTenantUser } =
  mapGetters('auth')
const { doRefreshCurrentUser } = mapActions('auth')
const { getGuides } = mapActions('quickstartGuide')
const { guides, notcompletedGuides } = mapGetters(
  'quickstartGuide'
)

const activeView = ref(null)
const selectedGuide = ref(null)

const eagleEyeModalOpened = ref(false)
const onboardingGuidesDismissed = ref(false)

const minCommunitySize = computed(() => {
  if (!currentTenant.value.communitySize) {
    return null
  }
  // If community size bigger than 5000
  const [min] = currentTenant.value.communitySize
    .split(/[><-]/g)
    .filter((sub) => sub.length > 0)
    .map((el) => +el)
  return min
})

watch(
  () => currentTenantUser,
  (tenantUser) => {
    if (tenantUser) {
      showModals()
    }
  },
  {
    deep: true,
    immediate: true
  }
)

const dismissGuides = () => {
  ConfirmDialog({
    type: 'notification',
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

const showModals = () => {
  // Check if it can open eagle eye onboarding modal
  const {
    isEagleEyeGuideDismissed,
    isQuickstartGuideDismissed
  } = currentTenantUser.value.settings
  if (
    minCommunitySize.value &&
    minCommunitySize.value < 5000 &&
    !isEagleEyeGuideDismissed &&
    !eagleEyeModalOpened.value
  ) {
    eagleEyeModalOpened.value = true
  }

  // Check if onboarding guides dismissed
  onboardingGuidesDismissed.value =
    isQuickstartGuideDismissed || false
  if (!onboardingGuidesDismissed.value) {
    activeView.value = notcompletedGuides.value?.length
      ? notcompletedGuides.value[0].key
      : null
    getGuides({}).then(() => {
      activeView.value = notcompletedGuides.value?.length
        ? notcompletedGuides.value[0].key
        : null
    })
  }
}

onMounted(() => {
  doRefreshCurrentUser({})
  if (currentTenantUser.value) {
    showModals()
  }
})
</script>

<style lang="scss">
.el-collapse {
  @apply border-none;

  .el-collapse-item__header {
    line-height: 1.25rem !important;
    height: auto !important;
    @apply text-xs font-medium py-4;

    &.is-active {
      @apply font-semibold;
    }
  }

  .el-collapse-item {
    &:last-child {
      .el-collapse-item__wrap,
      .el-collapse-item__header {
        border-bottom: 0;
      }
    }
  }

  .el-collapse-item__content {
    padding: 0;
  }
}
</style>
