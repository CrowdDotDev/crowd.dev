<template>
  <section class="px-6">
    <div class="flex items-center justify-between pb-4">
      <h6 class="text-base leading-6 font-semibold">
        Completed tasks ({{ tasks.length }})
      </h6>
      <div>
        <app-task-closed-dropdown />
      </div>
    </div>
    <div>
      <div v-if="loading">
        <app-task-item :loading="true"></app-task-item>
        <app-task-item :loading="true"></app-task-item>
      </div>
      <div v-else>
        <app-task-item
          v-for="task of tasks"
          :key="task.id"
          :task="task"
        />
        <div
          v-if="tasks.length === 0"
          class="pt-16 pb-14 flex justify-center items-center"
        >
          <div
            class="ri-checkbox-multiple-blank-line text-3xl text-gray-300 flex items-center h-10"
          ></div>
          <p class="pl-6 text-sm text-gray-400 italic">
            No completed tasks yet
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AppTaskClosed'
}
</script>

<script setup>
import AppTaskClosedDropdown from '@/modules/task/components/task-closed-dropdown'
import AppTaskItem from '@/modules/task/components/task-item'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { TaskService } from '@/modules/task/task-service'
import Message from '@/shared/message/message'
import { useStore } from 'vuex'
import { mapState } from '@/shared/vuex/vuex.helpers'

const store = useStore()

const { closedTasksCount } = mapState('task')

const tasks = ref([])
const tasksCount = ref(0)
const loading = ref(false)
const initialLoad = ref(false)

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadClosedTasks') {
    fetchTasks()
  }
})

onMounted(() => {
  fetchTasks()
})

onBeforeUnmount(() => {
  storeUnsubscribe()
})

const fetchTasks = () => {
  if (!initialLoad.value) {
    loading.value = true
  }

  TaskService.list(
    {
      status: { eq: 'done' }
    },
    'updatedAt_DESC',
    20,
    0
  )
    .then(({ rows, count }) => {
      tasks.value = rows
      tasksCount.value = count
      closedTasksCount.value = count
    })
    .catch(() => {
      tasks.value = []
      Message.error('There was an error loading tasks')
    })
    .finally(() => {
      loading.value = false
      initialLoad.value = true
    })
}
</script>
