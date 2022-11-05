<template>
  <div class="flex items-center justify-between">
    <div class="flex text-xs text-gray-600">
      <div
        class="px-3 h-8 border border-gray-200 border-r-0 rounded-l-md flex items-center justify-center transition hover:bg-gray-50 cursor-pointer"
        :class="tabClasses('all')"
        @click="tab = 'all'"
      >
        All
      </div>
      <div
        class="px-3 h-8 border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 cursor-pointer"
        :class="tabClasses('mine')"
        @click="tab = 'mine'"
      >
        Assigned to me
      </div>
      <div
        class="px-3 h-8 border border-gray-200 border-l-0 rounded-r-md flex items-center justify-center bg-white transition hover:bg-gray-50 cursor-pointer"
        :class="tabClasses('overdue')"
        @click="tab = 'overdue'"
      >
        Overdue
      </div>
    </div>
    <el-dropdown
      class="ml-4"
      placement="bottom-end"
      trigger="click"
    >
      <div class="flex items-center text-xs">
        <span class="text-gray-500">Sort:</span>
        <span class="text-gray-900 pl-1"
          >Creation date</span
        >
        <i
          class="ri-arrow-down-s-line text-base ml-1 transition transform"
        ></i>
      </div>
      <template #dropdown>
        <el-dropdown-menu class="w-55">
          <el-dropdown-item class="!px-3">
            <div class="flex justify-between w-full">
              <span class="text-xs">Creation date</span>
              <span class="text-2xs text-gray-400"
                >Newest first</span
              >
            </div>
          </el-dropdown-item>
          <el-dropdown-item class="!px-3">
            <div class="flex justify-between w-full">
              <span class="text-xs">Due date</span>
              <span class="text-2xs text-gray-400"
                >Earliest first</span
              >
            </div>
          </el-dropdown-item>
          <el-dropdown-item class="!px-3">
            <div class="flex justify-between w-full">
              <span class="text-xs">Title</span>
              <span class="text-2xs text-gray-400"
                >A-Z</span
              >
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'AppTaskFilters'
}
</script>

<script setup>
import { ref } from 'vue'
const tab = ref('all')

const tabClasses = (tabName) => {
  return tab.value === tabName
    ? 'bg-gray-100 font-medium text-gray-900'
    : 'bg-white'
}
</script>
