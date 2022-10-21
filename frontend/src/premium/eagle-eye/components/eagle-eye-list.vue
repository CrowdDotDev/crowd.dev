<template>
  <div class="eagle-eye-list">
    <div v-if="count > 0">
      <transition-group name="fade" mode="out-in">
        <app-eagle-eye-list-item
          v-for="record in rows"
          :key="record.id"
          :record="record"
        />
      </transition-group>
    </div>
    <div
      v-else
      class="flex items-center justify-center flex-col text-gray-600 pt-4"
    >
      <i class="ri-3x ri-folder-3-line"></i>
      <span class="text-sm"
        >{{ computedEmptyStateCopy }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppEagleEyeList'
}
</script>

<script setup>
import AppEagleEyeListItem from './eagle-eye-list-item'
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()

const count = computed(() => store.state.eagleEye.count)
const rows = computed(() => store.getters['eagleEye/rows'])

const computedEmptyStateCopy = computed(() => {
  if (
    store.state.eagleEye.filter.keywords &&
    store.state.eagleEye.filter.keywords.length > 0
  ) {
    return 'No posts found based on your search criteria'
  } else if (
    store.getters['eagleEye/activeView'].id === 'excluded'
  ) {
    return 'No excluded posts'
  } else if (
    store.getters['eagleEye/activeView'].id === 'engaged'
  ) {
    return 'No engaged posts'
  } else {
    return 'No posts found'
  }
})
</script>
