<template>
  <div class="panel !p-0 !rounded-lg" v-bind="$attrs">
    <header class="bg-purple-50 p-4 relative">
      <div class="flex justify-between items-center">
        <i
          class="ri-lightbulb-line text-lg text-purple-800"
        ></i>
        <div class="cursor-pointer">
          <i
            class="ri-close-fill text-lg text-gray-400"
          ></i>
        </div>
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
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { onboardingGuides } from '@/modules/dashboard/config/onboarding-guides'
import AppDashboardGuideItem from '@/modules/dashboard/components/guide/dashboard-guide-item.vue'
import AppDashboardGuideModal from '@/modules/dashboard/components/guide/dashboard-guide-modal.vue'

const store = useStore()
const router = useRouter()

const guides = onboardingGuides({
  store,
  router
}).map((el) => ({
  ...el,
  completed: el.completed(),
  display: el.display()
}))

// const completedGuides = computed(() => guides.filter((g) => g.completed))

const activeView = ref(guides?.length ? guides[0].id : null)

const selectedGuide = ref(null)
</script>
