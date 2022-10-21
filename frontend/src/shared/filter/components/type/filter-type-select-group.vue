<template>
  <div
    class="filter-type-select-group filter-content-wrapper"
  >
    <div
      v-for="option of computedOptions"
      :key="option.label.key"
      class="mb-3"
    >
      <div
        class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
      >
        {{ option.label.value }}
      </div>
      <div
        v-for="nestedOption of option.nestedOptions"
        :key="nestedOption.value"
        class="filter-type-select-option group"
        :class="nestedOption.selected ? 'is-selected' : ''"
        @click="
          handleOptionClick(nestedOption, option.label)
        "
      >
        <div>
          {{
            nestedOption.label.charAt(0).toUpperCase() +
            nestedOption.label.slice(1)
          }}
        </div>
        <i
          v-if="nestedOption.selected"
          class="ri-check-line text-brand-600"
        ></i>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeSelectGroup'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },
  value: {
    type: Object,
    default: () => {}
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:value'])
const computedOptions = computed(() => {
  return props.options.map((o) => {
    return {
      ...o,
      nestedOptions: o.nestedOptions.map((n) => {
        return {
          ...n,
          selected:
            model.value?.value === n.value &&
            model.value?.key === o.label.key
        }
      })
    }
  })
})
const model = computed({
  get() {
    return props.value
  },
  set(v) {
    emit('update:value', v)
  }
})

const handleOptionClick = (option, label) => {
  model.value = {
    displayValue:
      option.label.charAt(0).toUpperCase() +
      option.label.slice(1),
    displayKey: label.value,
    type: label.type,
    key: label.key,
    value: option.value
  }
}
</script>

<style lang="scss">
.filter-type-select {
  &-option.group {
    @apply justify-between;

    &.is-selected,
    &:focus.is-selected {
      i {
        @apply mr-0;
      }
    }
  }
}
</style>
