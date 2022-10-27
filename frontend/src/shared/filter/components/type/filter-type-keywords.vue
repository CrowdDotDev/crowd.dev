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
  value: {
    type: String,
    default: null
  },
  operator: {
    type: String,
    default: null
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:value',
  'update:operator'
])
const model = computed({
  get() {
    return props.value
  },
  set(v) {
    emit('update:value', v)
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
