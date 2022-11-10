<template>
  <section class="panel px-5 pb-3">
    <div class="pb-6">
      <div class="flex items-center">
        <div
          class="h-6 w-6 rounded-md bg-purple-50 flex items-center justify-center"
        >
          <div
            class="ri-lightbulb-line text-sm h-4 flex items-center text-purple-500"
          ></div>
        </div>
        <h6 class="text-base leading-6 font-semibold pl-3">
          Suggestions
        </h6>
      </div>
    </div>
    <div class="-mx-5">
      <article
        v-for="task of tasks"
        :key="task.id"
        class="px-5 pt-4 pb-5 border-t border-gray-100"
      >
        <h6 class="text-2xs font-semibold leading-4.5 pb-1">
          {{ task.name }}
        </h6>
        <p class="text-xs leading-5 text-gray-600 pb-4">
          {{ task.body }}
        </p>
        <el-button
          class="btn btn--secondary btn--sm !py-2.5 w-full"
          @click="addTask(task)"
        >
          Add task
        </el-button>
      </article>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AppTaskSuggested'
}
</script>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  mapActions,
  mapGetters
} from '@/shared/vuex/vuex.helpers'
import { TaskService } from '@/modules/task/task-service'
import Message from '@/shared/message/message'
import { useStore } from 'vuex'

const { currentUser } = mapGetters('auth')
const { editTask } = mapActions('task')

const store = useStore()

const tasks = ref([])
const taskCount = ref(0)
const loading = ref(false)
const intitialLoad = ref(false)

const addTask = (task) => {
  editTask({
    ...task,
    assignees: [currentUser.value]
  })
}

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadSuggestedTasks') {
    fetchTasks()
  }
})

onBeforeUnmount(() => {
  storeUnsubscribe()
})

onMounted(() => {
  fetchTasks()
})

const fetchTasks = () => {
  if (!intitialLoad.value) {
    loading.value = true
  }

  TaskService.list(
    {
      type: 'suggested'
    },
    'createdAt_DESC',
    20,
    0
  )
    .then(({ rows, count }) => {
      tasks.value = rows
      taskCount.value = count
    })
    .catch(() => {
      tasks.value = []
      taskCount.value = 0
      Message.error('There was an error loading tasks')
    })
    .finally(() => {
      loading.value = false
      intitialLoad.value = true
    })
}
</script>
