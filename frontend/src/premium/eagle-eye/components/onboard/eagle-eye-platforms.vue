<template>
  <div>
    <h6 class="text-gray-900">Select platforms</h6>
    <div class="text-xs mt-2 text-gray-500">
      Choose the community platforms and timeframe you want
      to monitor.
    </div>
  </div>

  <div class="mt-8">
    <div class="text-gray-900 text-xs font-semibold">
      Date published
    </div>
    <div class="flex gap-2 mt-2">
      <el-radio-group
        id="tenantSize"
        v-model="publishedDate"
        class="radio-chips together"
        size="medium"
      >
        <el-radio-button
          v-for="option in publishedDateOptions"
          :key="option.value"
          :label="option.label"
        >
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
  </div>

  <div class="mt-8">
    <div class="text-gray-900 text-xs font-semibold mb-2">
      Platforms
      <span class="text-brand-500 ml-0.5 font-normal"
        >*</span
      >
    </div>

    <div
      v-for="[key, value] of Object.entries(platforms)"
      :key="key"
      class="h-12 flex items-center border-b last:border-none border-gray-200 hover:bg-gray-50 hover:cursor-pointer"
    >
      <div>
        <img :src="value.img" class="w-6 h-6" />
      </div>
      <el-switch
        v-model="value.enabled"
        :inactive-text="value.label"
        class="h-full"
      />
    </div>
  </div>

  <eagle-eye-footer
    :show-previous-step="true"
    :is-next-button-disabled="!isPlatformsFormValid"
    @on-step-change="
      (increment) => emit('onStepChange', increment)
    "
  />
</template>

<script setup>
import EagleEyeFooter from '@/premium/eagle-eye/components/onboard/eagle-eye-footer.vue'
import {
  computed,
  defineProps,
  defineEmits,
  watch,
  ref
} from 'vue'
import { publishedDateOptions } from '@/premium/eagle-eye/eagle-eye-constants'

const emit = defineEmits([
  'update:platforms',
  'update:publishedDate',
  'onStepChange'
])
const props = defineProps({
  platforms: {
    type: Object,
    required: true
  },
  publishedDate: {
    type: String,
    required: true
  }
})

const arePlatformsValid = (platformsObject) => {
  return Object.values(platformsObject).some(
    (p) => p.enabled
  )
}

const isPlatformsFormValid = ref(
  arePlatformsValid(props.platforms)
)

const platforms = computed({
  get() {
    return props.platforms
  },
  set(v) {
    emit('update:platforms', v)
  }
})

const publishedDate = computed({
  get() {
    return props.publishedDate
  },
  set(v) {
    emit('update:publishedDate', v)
  }
})

watch(
  () => props.platforms,
  (updatedPlatforms) => {
    isPlatformsFormValid.value = arePlatformsValid(
      updatedPlatforms
    )
  },
  { deep: true }
)
</script>

<style lang="scss">
.el-radio-group {
  &.radio-chips.together {
    .el-radio-button {
      @apply mr-0 mb-0;

      .el-radio-button__inner {
        @apply border-l-0 h-8 px-2 rounded-none border-gray-200 text-gray-500;
      }

      &.is-active {
        .el-radio-button__inner {
          @apply border-r border-y border-brand-500 rounded-none text-gray-900;
          box-shadow: -1px 0 0 0 rgb(233 79 46);
        }
      }

      &:first-child .el-radio-button__inner {
        @apply rounded-l-lg border-l;
      }

      &:last-child .el-radio-button__inner {
        @apply rounded-r-lg;
      }
    }
  }
}
</style>
