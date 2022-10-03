<template>
  <el-dropdown trigger="click">
    <el-button class="btn btn__secondary">{{
      compositor.slice(0, 1).toUpperCase() +
      compositor.slice(1, compositor.length)
    }}</el-button>
    <template #dropdown>
      <el-dropdown-item> And </el-dropdown-item>
      <el-dropdown-item> Or </el-dropdown-item>
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

defineEmits(['operator-changed'])
</script>
