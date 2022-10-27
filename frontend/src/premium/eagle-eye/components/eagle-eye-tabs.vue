<template>
  <div class="relative">
    <el-tabs v-model="model" class="mb-6">
      <el-tab-pane
        v-for="view of views"
        :key="view.id"
        :label="view.label"
        :name="view.id"
      ></el-tab-pane>
    </el-tabs>
    <span
      v-if="showResetView"
      type="button"
      class="btn btn-brand btn-brand--transparent btn--md absolute right-0 inset-y-0"
      @click="resetView"
    >
      Reset view
    </span>
  </div>
</template>

<script>
export default {
  name: 'AppEagleEyeTabs'
}
</script>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const showResetView = computed(
  () => store.getters['eagleEye/showResetView']
)
const model = computed({
  get() {
    return Object.values(store.state.eagleEye.views).find(
      (v) => v.active
    ).id
  },
  set(value) {
    store.dispatch('eagleEye/doChangeActiveView', value)
  }
})
const views = computed(() => {
  return Object.values(store.state.eagleEye.views)
})

const resetView = () => {
  store.dispatch('eagleEye/doResetActiveView')
}
</script>
