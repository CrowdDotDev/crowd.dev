<template>
  <div class="filter-dropdown">
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      @visible-change="handleDropdownChange"
    >
      <el-button
        class="filter-dropdown-trigger"
        :class="isExpanded ? 'is-expanded' : ''"
      >
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
            :class="item.selected ? 'is-selected' : ''"
            @click="handleOptionClick(item)"
          >
            <div class="flex items-center justify-between">
              <span class="block">{{ item.label }}</span>
              <i
                v-if="item.selected"
                class="ri-check-line text-brand-600 absolute right-0 mr-8"
              ></i>
            </div>
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
            :class="item.selected ? 'is-selected' : ''"
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
import { defineProps, computed, h, ref } from 'vue'
import { useStore } from 'vuex'
import queryFilterFunction from '@/shared/filter/helpers/query-filter'

const store = useStore()
const props = defineProps({
  module: {
    type: String,
    required: true
  },
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
const isExpanded = ref(false)

const activeView = computed(
  () => store.getters[`${props.module}/activeView`]
)
const computedAttributes = computed(() =>
  props.attributes
    .filter((a) => queryFilterFunction(a, query.value))
    .map((a) => {
      a.selected =
        store.state[props.module].views[activeView.value.id]
          .filter.attributes[a.name] !== undefined &&
        store.state[props.module].views[activeView.value.id]
          .filter.attributes[a.name].show !== false
      return a
    })
    .sort((a, b) =>
      Intl.Collator().compare(a.label, b.label)
    )
)
const computedCustomAttributes = computed(() =>
  props.customAttributes
    .filter((a) => queryFilterFunction(a, query.value))
    .map((a) => {
      a.selected =
        store.state[props.module].views[activeView.value.id]
          .filter.attributes[a.name] !== undefined
      a.custom = true
      return a
    })
    .sort((a, b) =>
      Intl.Collator().compare(a.label, b.label)
    )
)

function handleDropdownChange(value) {
  isExpanded.value = value
  if (value) {
    queryInput.value.focus()
  }
}
function handleOptionClick(v) {
  if (
    store.state[props.module].views[activeView.value.id]
      .filter[v.name] === undefined
  ) {
    store.dispatch(`${props.module}/addFilterAttribute`, {
      ...v.forFilter(),
      expanded: true
    })
  }
}
</script>

<style lang="scss">
.filter-dropdown {
  &-search .el-input__wrapper {
    border: none !important;
    @apply shadow-none;
    &.is-focus,
    &:hover {
      @apply shadow-none;
    }
  }

  &-trigger.el-button,
  &-trigger.el-button:focus:not(.is-expanded),
  .el-input-group__append &-trigger.el-button,
  .el-input-group__append
    &-trigger.el-button:focus:not(.is-expanded) {
    @apply h-10 flex justify-center items-center py-0 px-4 bg-white border border-l-0 rounded-l-none border-gray-300 outline-none text-gray-600;
    transition: all 0.2s ease;

    &.is-expanded,
    &:hover,
    &:active {
      @apply bg-gray-100 outline-none text-gray-600 border-gray-300;
    }
  }
}
</style>
