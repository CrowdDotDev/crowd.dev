<template>
  <div class="px-6 lg:container lg:px-10">
    <!-- header -->
    <div class="flex justify-center">
      <div
        class="w-full"
        :class="
          suggestedTasks && suggestedTasks.taskCount > 0
            ? 'md:w-full lg:w-full'
            : 'md:w-10/12 lg:w-10/12'
        "
      >
        <div class="pt-1 pb-8">
          <h4 class="text-xl font-semibold leading-9 mb-1">
            Tasks
          </h4>
          <p class="text-xs text-gray-500 leading-5">
            Manage your daily tasks and get suggestions to
            take action in your community
          </p>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap justify-center -mx-3">
      <div
        class="w-full px-3"
        :class="
          suggestedTasks && suggestedTasks.taskCount > 0
            ? 'md:w-8/12 lg:w-8/12'
            : 'md:w-10/12 lg:w-10/12'
        "
      >
        <app-task-open
          class="mb-10"
          @add-task="addTask()"
          @edit-task="editTask($event)"
        />
        <app-task-closed />
      </div>
      <div
        class="w-full"
        :class="
          suggestedTasks && suggestedTasks.taskCount > 0
            ? 'md:w-4/12 lg:w-4/12 px-3'
            : ''
        "
      >
        <app-task-suggested ref="suggestedTasks" />
      </div>
    </div>
  </div>
  <app-task-form
    v-model="openForm"
    :task="selectedTask"
    @close="task = null"
  />
  <app-task-archived v-model="archivedTasks" />
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
import {
  onBeforeUnmount,
  onMounted,
  ref,
  defineExpose
} from 'vue'
import { useStore } from 'vuex'
import { mapActions } from '@/shared/vuex/vuex.helpers'
import AppTaskArchived from '@/modules/task/components/task-archived'

const store = useStore()

const openForm = ref(false)
const selectedTask = ref(null)
const archivedTasks = ref(false)

const suggestedTasks = ref(null)

const { reloadTaskPage } = mapActions('task')

const addTask = () => {
  openForm.value = true
  selectedTask.value = null
}

const editTask = (task) => {
  openForm.value = true
  selectedTask.value = task
}

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/addTask') {
    addTask()
  }
  if (action.type === 'task/editTask') {
    editTask(action.payload)
  }
  if (action.type === 'task/openArchivedTasks') {
    archivedTasks.value = true
  }
})

onMounted(() => {
  reloadTaskPage()
})

onBeforeUnmount(() => {
  storeUnsubscribe()
})

defineExpose({
  suggestedTasks
})
</script>
