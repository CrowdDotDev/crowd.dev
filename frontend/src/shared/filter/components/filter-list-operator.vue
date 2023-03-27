<template>
  <el-dropdown
    trigger="click"
    placement="bottom-start"
    class="filter-list-operator"
  >
    <el-button class="filter-list-operator-btn">
      {{
        operator.slice(0, 1).toUpperCase()
          + operator.slice(1, operator.length)
      }}
    </el-button>
    <template #dropdown>
      <el-dropdown-item
        class="filter-list-operator-option"
        :class="operator === 'and' ? 'is-selected' : ''"
        @click.stop="handleClick('and')"
      >
        And
      </el-dropdown-item>
      <el-dropdown-item
        class="filter-list-operator-option"
        :class="operator === 'or' ? 'is-selected' : ''"
        @click.stop="handleClick('or')"
      >
        Or
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  operator: {
    type: String,
    default: 'and',
  },
});

const emit = defineEmits(['change']);

const handleClick = (value) => {
  emit('change', value);
};
</script>

<script>
export default {
  name: 'AppFilterListOperator',
};
</script>

<style lang="scss">
.filter-list-operator {
  @apply text-xs mb-4;

  &-btn.el-button {
    @apply h-8 flex items-center p-2 bg-white border border-gray-300 outline-none text-gray-600 text-xs;
    transition: all 0.2s ease;

    &.is-expanded,
    &:hover,
    &:active,
    &:focus,
    &:visited {
      @apply bg-gray-100 outline-none text-gray-600 border-gray-300;
    }
  }

  &-option {
    @apply px-3 py-2.5;
  }
}
</style>
