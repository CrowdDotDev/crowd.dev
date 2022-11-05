<template>
  <div class="px-6 lg:container lg:px-10">
    <!-- header -->
    <div class="pt-1 pb-8">
      <h4 class="text-xl font-semibold leading-9 mb-1">
        Tasks
      </h4>
      <p class="text-xs text-gray-500 leading-5">
        Manage your daily tasks and get suggestions to take
        action in your community
      </p>
    </div>
    <div class="flex flex-wrap -mx-3">
      <div class="w-full md:w-8/12 lg:w-8/12 px-3">
        <app-task-open class="mb-10" />
        <app-task-closed />
      </div>
      <div class="w-full md:w-4/12 lg:w-4/12 px-3">
        <app-task-suggested />
      </div>
    </div>
  </div>
  <app-task-form />
</template>

<script>
export default {
  name: 'AppTaskPage'
}
</script>

<script setup>
import AppTaskOpen from '@/modules/task/components/task-open'
import AppTaskClosed from '@/modules/task/components/task-closed'
import AppTaskSuggested from '@/modules/task/components/task-suggested'
import AppTaskForm from '@/modules/task/components/task-form'
</script>
