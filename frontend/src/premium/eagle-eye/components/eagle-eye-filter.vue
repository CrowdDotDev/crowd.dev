<template>
  <div class="eagle-eye-filter">
    <div class="flex">
      <app-eagle-eye-search
        v-model:is-button-disabled="isButtonDisabled"
      />
      <app-filter-dropdown
        module="eagleEye"
        :attributes="eagleEyeAttributes"
      />
      <button
        type="button"
        class="btn btn--primary btn--md ml-4"
        :disabled="isButtonDisabled"
        @click="handleSearch"
      >
        Search
      </button>
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
import { ref } from 'vue'
import { EagleEyeModel } from '@/premium/eagle-eye/eagle-eye-model'
import AppEagleEyeSearch from '@/premium/eagle-eye/components/eagle-eye-search'
import AppFilterList from '@/shared/filter/components/filter-list'
import { mapActions } from '@/shared/vuex/vuex.helpers'

const eagleEyeAttributes = Object.values(
  EagleEyeModel.fields
).filter((f) => f.filterable)

const isButtonDisabled = ref(true)

const { doPopulate, doFetch } = mapActions('eagleEye')

const handleSearch = async function () {
  await doPopulate({})
  await doFetch({})
}
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
