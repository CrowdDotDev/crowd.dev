<template>
  <section class="panel pt-5 pb-4">
    <div class="flex items-center justify-between pb-4">
      <h6 class="text-base leading-6 font-semibold">
        Open tasks (2)
      </h6>
      <el-button
        class="btn btn--primary btn--md font-medium"
      >
        Add task
      </el-button>
    </div>
    <app-task-filters class="pb-6" />
    <div class="-mx-6">
      <app-task-item class="px-6" />
      <app-task-item class="px-6" />
    </div>
  </section>
</template>

<script>
export default {
  name: 'AppTaskOpen'
}
</script>

<script setup>
import AppTaskItem from '@/modules/task/components/task-item'
import AppTaskFilters from '@/modules/task/components/task-filters'
</script>
