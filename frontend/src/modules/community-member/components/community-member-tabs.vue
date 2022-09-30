<template>
  <el-tabs v-model="model" class="mb-6">
    <el-tab-pane
      v-for="view of views"
      :key="view.id"
      :label="view.name"
      :name="view.id"
    ></el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const model = computed({
  get() {
    return Object.values(
      store.state.communityMember.views
    ).find((v) => v.active).id
  },
  set(value) {
    store.dispatch(
      'communityMember/doChangeActiveView',
      value
    )
  }
})
const views = computed(() => {
  return Object.values(store.state.communityMember.views)
})
</script>
