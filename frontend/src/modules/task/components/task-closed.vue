<template>
  <section class="px-6">
    <div class="flex items-center justify-between pb-4">
      <h6 class="text-base leading-6 font-semibold">
        Completed tasks (4)
      </h6>
      <div>
        <app-task-closed-dropdown />
      </div>
    </div>
    <div>
      <app-task-item :completed="true" />
      <app-task-item :completed="true" />
    </div>
  </section>
</template>

<script>
import AppTaskItem from '@/modules/task/components/task-item'
import AppTaskClosedDropdown from '@/modules/task/components/task-closed-dropdown'
export default {
  name: 'AppTaskClosed',
  components: { AppTaskClosedDropdown, AppTaskItem }
}
</script>

<script setup></script>
