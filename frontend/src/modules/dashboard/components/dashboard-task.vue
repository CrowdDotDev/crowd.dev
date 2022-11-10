<template>
  <div v-if="tasks.length > 0" class="panel !p-0">
    <!-- header -->
    <div
      class="flex items-center justify-between border-b border-gray-100 px-6 py-5"
    >
      <div class="flex items-center">
        <div
          class="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center mr-4"
        >
          <i
            class="ri-checkbox-multiple-line text-lg text-white"
          ></i>
        </div>
        <h6 class="text-sm font-semibold leading-5">
          My open tasks
        </h6>
      </div>
      <div class="flex items-center">
        <router-link
          :to="{ name: 'task' }"
          class="text-xs text-brand-500 font-medium mr-6"
        >
          All tasks
        </router-link>
        <button
          class="btn btn--secondary btn--sm !py-2.5 !px-3"
          @click="addTask()"
        >
          Add task
        </button>
      </div>
    </div>
    <div
      class="flex-grow overflow-auto widget-content pb-4"
    >
      <div v-if="loading">
        <app-task-item
          class="px-6"
          :loading="true"
        ></app-task-item>
        <app-task-item
          class="px-6"
          :loading="true"
        ></app-task-item>
      </div>
      <div v-else>
        <app-task-item
          v-for="task of tasks"
          :key="task.id"
          class="px-6"
          :task="task"
        />
        <div
          v-if="tasks.length < taskCount"
          class="flex justify-center pt-8 pb-1"
        >
          <div
            class="flex items-center cursor-pointer"
            @click="fetchTasks(true)"
          >
            <div
              class="ri-arrow-down-line text-base text-brand-500 flex items-center h-4"
            ></div>
            <div
              class="pl-2 text-xs leading-5 text-brand-500 font-medium"
            >
              Load more
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <app-task-form
    v-model="openForm"
    :task="selectedTask"
    @close="task = null"
  />
</template>

<script>
export default {
  name: 'AppDashboardTask'
}
</script>

<script setup>
import AppTaskForm from '@/modules/task/components/task-form'
import { onBeforeUnmount, ref, onMounted } from 'vue'
import { TaskService } from '@/modules/task/task-service'
import Message from '@/shared/message/message'
import { useStore } from 'vuex'
import AppTaskItem from '@/modules/task/components/task-item'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const store = useStore()
const { currentUser } = mapGetters('auth')

const openForm = ref(false)
const selectedTask = ref(null)
const tasks = ref([])
const taskCount = ref(0)
const loading = ref(false)

const addTask = () => {
  openForm.value = true
  selectedTask.value = null
}

const editTask = (task) => {
  openForm.value = true
  selectedTask.value = task
}

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadOpenTasks') {
    fetchTasks()
  }
  if (action.type === 'task/addTask') {
    addTask()
  }
  if (action.type === 'task/editTask') {
    editTask(action.payload)
  }
})

onMounted(() => {
  fetchTasks()
})

onBeforeUnmount(() => {
  storeUnsubscribe()
})

const fetchTasks = (loadMore = false) => {
  loading.value = true

  TaskService.list(
    {
      type: 'regular',
      status: 'in-progress',
      assignees: [currentUser.value.id]
    },
    '',
    20,
    loadMore ? tasks.value.length : 0
  )
    .then(({ rows, count }) => {
      tasks.value = loadMore
        ? [...tasks.value, ...rows]
        : rows
      taskCount.value = count
    })
    .catch(() => {
      if (!loadMore) {
        tasks.value = []
      }
      Message.error('There was an error loading tasks')
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style>
.widget-content {
  max-height: 420px;
}
</style>
