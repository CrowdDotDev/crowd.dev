<template>
  <h6 class="text-gray-900">Choose keywords</h6>
  <div class="text-xs text-gray-500 mt-2">
    Choose keywords that are relevant to the niche that you
    want to grow in. For example, we at crowd.dev are
    monitoring “community-led growth”, “community building”,
    and “DevRel”.
  </div>

  <div class="mt-8">
    <div
      class="uppercase text-gray-400 text-2xs font-semibold tracking-wide"
    >
      Include<span class="text-brand-500 ml-0.5">*</span>
    </div>

    <el-form
      class="mt-3 eagle-eye-keywords-form flex flex-col gap-3"
    >
      <div
        v-for="(keyword, index) in keywords"
        :key="index"
        class="flex gap-3"
      >
        <el-form-item class="flex-1">
          <el-input v-model="keyword.value" />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="keyword.type"
            popper-class="eagle-eye-keywords-select"
          >
            <el-option
              v-for="matchType in matchTypes"
              :key="matchType.value"
              :label="matchType.label"
              :value="matchType.value"
              class="!h-fit !px-3"
              @mouseleave="onSelectMouseLeave"
            >
              <div class="block py-3">
                <div
                  class="text-xs font-medium h-fit leading-6"
                >
                  {{ matchType.label }}
                </div>
                <div
                  class="text-2xs text-gray-500 leading-4 h-fit"
                >
                  {{ matchType.description }}
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-button
          class="btn btn--md btn--transparent w-10 h-10"
          :disabled="keywords.length === 1"
          @click="deleteKeyword(index)"
        >
          <i class="ri-delete-bin-line text-lg"></i>
        </el-button>
      </div>
    </el-form>

    <el-button
      class="btn btn-link btn-link--md btn-link--primary mt-3"
      @click="addKeyword"
      >+ Add keyword</el-button
    >
  </div>

  <eagle-eye-footer
    :is-next-button-disabled="!isKeywordsFormValid"
    @on-step-change="
      (increment) => emit('onStepChange', increment)
    "
  />
</template>

<script setup>
import EagleEyeFooter from '@/premium/eagle-eye/components/onboard/eagle-eye-footer.vue'
import { defineEmits, computed, defineProps } from 'vue'
import { matchTypes } from '@/premium/eagle-eye/eagle-eye-constants'
import { onSelectMouseLeave } from '@/utils/select'

const emit = defineEmits([
  'update:modelValue',
  'onStepChange'
])
const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
})

const keywords = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  }
})

const isKeywordsFormValid = computed(
  () => !keywords.value.some((k) => !k.value)
)

const addKeyword = () => {
  keywords.value.push({
    value: null,
    type: 'semantic'
  })
}

const deleteKeyword = (index) => {
  keywords.value.splice(index, 1)
}
</script>

<style lang="scss">
.eagle-eye-keywords-form {
  .el-form-item,
  .el-form-item__content {
    @apply mb-0;
  }
}

.el-select__popper.eagle-eye-keywords-select
  .el-select-dropdown
  .el-select-dropdown__item.selected::after {
  display: none;
}
</style>
