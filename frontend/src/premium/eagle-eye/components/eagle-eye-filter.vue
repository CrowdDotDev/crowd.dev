<template>
  <div class="eagle-eye-filter">
    <div class="flex">
      <app-eagle-eye-search />
      <app-filter-dropdown
        module="eagleEye"
        :attributes="eagleEyeAttributes"
      />
    </div>
    <app-filter-list module="eagleEye" :search="false" />
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
import { EagleEyeModel } from '@/premium/eagle-eye/eagle-eye-model'
import AppEagleEyeSearch from '@/premium/eagle-eye/components/eagle-eye-search'
import AppFilterList from '@/shared/filter/components/filter-list'

const store = useStore()

const eagleEyeAttributes = Object.values(
  EagleEyeModel.fields
).filter((f) => f.filterable)

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

<style lang="scss">
.eagle-eye-filter {
  @apply mt-6;
  .eagle-eye-search {
    @apply flex-grow;
    .el-keywords-input-wrapper {
      @apply rounded-r-none;
    }
  }
}
</style>
