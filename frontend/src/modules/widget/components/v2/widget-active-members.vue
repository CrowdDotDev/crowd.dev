<template>
  <div class="widget-active-members">
    <div class="grid grid-cols-3">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <app-widget-title
            text-size="text-xs"
            title="Active members today"
          />
          <button
            v-if="currentUser"
            type="button"
            class="btn btn-brand--transparent btn--sm"
            @click="handleDrawerOpen('day')"
          >
            View
          </button>
        </div>
        <app-widget-kpi
          :current-value="100"
          :previous-value="50"
          vs-label="vs. yesterday"
        ></app-widget-kpi>
      </div>
      <div class="p-6 border-l border-r border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <app-widget-title
            text-size="text-xs"
            title="Active members this week"
          />
          <button
            v-if="currentUser"
            type="button"
            class="btn btn-brand--transparent btn--sm"
            @click="handleDrawerOpen('week')"
          >
            View
          </button>
        </div>
        <app-widget-kpi
          :current-value="500"
          :previous-value="500"
          vs-label="vs. last week"
        ></app-widget-kpi>
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <app-widget-title
            text-size="text-xs"
            title="Active members this month"
          />
          <button
            v-if="currentUser"
            type="button"
            class="btn btn-brand--transparent btn--sm"
            @click="handleDrawerOpen('month')"
          >
            View
          </button>
        </div>
        <app-widget-kpi
          :current-value="1900"
          :previous-value="2200"
          vs-label="vs. last month"
        ></app-widget-kpi>
      </div>
    </div>
    <app-drawer
      v-model="computedDrawerExpanded"
      :title="computedDrawerTitle"
      size="480px"
    ></app-drawer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import AppWidgetKpi from './shared/widget-kpi'
import AppWidgetTitle from './shared/widget-title'

const { currentUser } = mapGetters('auth')

const drawerExpanded = ref(null)
const computedDrawerExpanded = computed({
  get() {
    return drawerExpanded.value !== null
  },
  set(value) {
    if (value === false) {
      drawerExpanded.value = null
    }
  }
})

const computedDrawerTitle = computed(() => {
  let period = 'today'
  if (drawerExpanded.value === 'week') {
    period = 'this week'
  } else if (drawerExpanded.value === 'month') {
    period = 'this month'
  }
  return `Active members ${period}`
})

const handleDrawerOpen = (period) => {
  drawerExpanded.value = period
}
</script>

<style lang="scss">
.widget-active-members {
  @apply bg-white shadow rounded-lg;
}
</style>
