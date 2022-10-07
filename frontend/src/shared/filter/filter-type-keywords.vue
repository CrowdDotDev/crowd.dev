<template>
  <div class="filter-type-keywords">
    <app-keywords-input
      ref="keywordsInputComponent"
      v-model="model"
      placeholder="Enter keywords..."
    />
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeKeywords'
}
</script>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  watch
} from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})
const emits = defineEmits(['update:modelValue'])
const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  }
})
const expanded = computed(() => props.isExpanded)

watch(expanded, (newValue) => {
  if (newValue) {
    document
      .querySelector(
        '.filter-list-item-popper .el-keywords-input'
      )
      .focus()
  }
})
</script>

<style lang="scss">
.filter-type-keywords {
  @apply mb-3;
  .el-keywords-input-wrapper {
    @apply h-8 min-h-8;
    &,
    &:hover,
    &.is-focus {
      @apply bg-gray-50 shadow-none border-none;
    }
  }
}
</style>
