<template>
  <el-dropdown
    trigger="click"
    placement="bottom-start"
    class="filter-list-compositor"
  >
    <el-button class="filter-list-compositor-btn">{{
      compositor.slice(0, 1).toUpperCase() +
      compositor.slice(1, compositor.length)
    }}</el-button>
    <template #dropdown>
      <el-dropdown-item
        :class="compositor === 'and' ? 'is-selected' : ''"
        @click.stop="handleClick('and')"
      >
        And
      </el-dropdown-item>
      <el-dropdown-item
        :class="compositor === 'or' ? 'is-selected' : ''"
        @click.stop="handleClick('or')"
      >
        Or
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script>
export default {
  name: 'AppFilterListCompositor'
}
</script>

<script setup>
import { defineProps, defineEmits } from 'vue'
defineProps({
  compositor: {
    type: String,
    default: 'and'
  }
})

const emits = defineEmits(['change'])

const handleClick = (value) => {
  emits('change', value)
}
</script>

<style lang="scss">
.filter-list-compositor {
  &-btn.el-button {
    @apply h-8 flex items-center p-2 bg-white border border-gray-300 outline-none text-gray-600;
    transition: all 0.2s ease;

    &.is-expanded,
    &:hover,
    &:active,
    &:focus,
    &:visited {
      @apply bg-gray-100 outline-none text-gray-600 border-gray-300;
    }
  }
}
</style>
