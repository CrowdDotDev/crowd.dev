<template>
  <div class="filter-dropdown">
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      @visible-change="handleDropdownChange"
    >
      <el-button class="btn btn--secondary btn--md">
        <i class="ri-lg ri-filter-3-line mr-2"></i>
        Filters
      </el-button>
      <template #dropdown>
        <div class="-m-2 border-b border-gray-100 p-2 mb-2">
          <el-input
            ref="queryInput"
            v-model="query"
            placeholder="Search..."
            class="filter-dropdown-search"
            :prefix-icon="SearchIcon"
          />
        </div>
        <div>
          <el-dropdown-item
            v-for="item of computedAttributes"
            :key="item.name"
            @click="handleOptionClick(item)"
          >
            {{ item.label }}
          </el-dropdown-item>
          <div
            v-if="computedCustomAttributes.length > 0"
            class="el-dropdown-title"
          >
            Custom Attributes
          </div>
          <el-dropdown-item
            v-for="item of computedCustomAttributes"
            :key="item.name"
            @click="handleOptionClick(item)"
          >
            {{ item.label }}
          </el-dropdown-item>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'AppFilterDropdown'
}
</script>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  h,
  ref
} from 'vue'
const emit = defineEmits(['filter-added'])
const props = defineProps({
  attributes: {
    type: Array,
    default: () => []
  },
  customAttributes: {
    type: Array,
    default: () => []
  }
})
const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

const query = ref('')
const queryInput = ref(null)
const filterFunction = (o) => {
  return (
    (o.name
      .toLowerCase()
      .includes(query.value.toLowerCase()) ||
      o.label
        .toLowerCase()
        .includes(query.value.toLowerCase())) &&
    o.show !== false
  )
}
const computedAttributes = computed(() =>
  props.attributes.filter(filterFunction)
)
const computedCustomAttributes = computed(() =>
  props.customAttributes.filter(filterFunction)
)

function handleDropdownChange(visible) {
  if (visible) {
    queryInput.value.focus()
  }
}
function handleOptionClick(v) {
  emit('filter-added', v)
}
</script>

<style lang="scss">
.filter-dropdown {
  &-search .el-input__wrapper {
    @apply shadow-none;
    &.is-focus,
    &:hover {
      @apply shadow-none;
    }
  }
}
</style>
