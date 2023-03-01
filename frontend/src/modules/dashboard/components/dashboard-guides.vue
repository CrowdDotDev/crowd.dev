<template>
  <div
    v-if="
      minCommunitySize >= 5000 &&
      notcompletedGuides.length > 0
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
        :key="guide.id"
        :guide="guide"
        :active="activeView === guide.id"
        @header-click="
          activeView =
            activeView !== guide.id ? guide.id : null
        "
        @open="selectedGuide = guide"
      />
    </section>
  </div>
  <app-dashboard-guide-modal v-model="selectedGuide" />
</template>

<script>
export default {
  name: 'AppDashboardGuides'
}
</script>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { onboardingGuides } from '@/modules/dashboard/config/onboarding-guides'
import AppDashboardGuideItem from '@/modules/dashboard/components/guide/dashboard-guide-item.vue'
import AppDashboardGuideModal from '@/modules/dashboard/components/guide/dashboard-guide-modal.vue'
import * as loom from '@loomhq/loom-embed'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'

const store = useStore()
const router = useRouter()

const { currentTenant } = mapGetters('auth')

const guides = ref([])

const activeView = ref(null)

const selectedGuide = ref(null)

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
  return Promise.all(
    onboardingGuides({
      store,
      router
    }).map((el) => {
      return loom.oembed(el.loomUrl).then((video) => ({
        ...el,
        loomThumbnailUrl: video.thumbnail_url,
        loomHtml: video.html,
        completed: el.completed(),
        display: el.display()
      }))
    })
  )
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
    // TODO dismiss guide
    console.log('dismissing guides')
  })
}

onMounted(async () => {
  if (minCommunitySize.value < 5000) {
    // TODO: trigger eagle eye modal
  }

  getGuides().then((guideList) => {
    guides.value = guideList
    activeView.value = notcompletedGuides.value?.length
      ? notcompletedGuides.value[0].id
      : null
  })
})
</script>
