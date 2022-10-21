<template>
  <div class="eagle-eye-filter">
    <app-filter-dropdown
      module="eagle-eye"
      :attributes="eagleEyeAttributes"
    />
  </div>
</template>

<script>
export default {
  name: 'AppEagleEyeFilter'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { onMounted } from 'vue'

const store = useStore()

const eagleEyeAttributes = []

async function doFetch() {
  const { filter } = store.state.eagleEye

  await store.dispatch('eagleEye/doFetch', {
    filter,
    keepPagination: true
  })
}

onMounted(async () => {
  await doFetch()
})
</script>
