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
import { EagleEyeModel } from '@/premium/eagle-eye/eagle-eye-model'
import AppEagleEyeSearch from '@/premium/eagle-eye/components/eagle-eye-search'
import AppFilterList from '@/shared/filter/components/filter-list'

const eagleEyeAttributes = Object.values(
  EagleEyeModel.fields
).filter((f) => f.filterable)
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
