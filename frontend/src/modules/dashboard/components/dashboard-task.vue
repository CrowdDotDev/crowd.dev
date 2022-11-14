<template>
  <div
    v-if="hasPermissionToTask || isTaskLocked"
    class="panel !p-0"
  >
    <!-- header -->
    <div
      class="flex items-center justify-between px-6 py-5"
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
          v-if="taskCreatePermission"
          class="btn btn--secondary btn--sm"
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
        <div v-if="tasks.length === 0">
          <div
            v-if="suggestedTasks.length > 0"
            class="pt-2 px-6"
          >
            <p
              class="text-2xs font-semibold uppercase text-gray-400 tracking-1 pb-4"
            >
              Task suggestions:
            </p>
            <div class="flex flex-wrap -mx-2">
              <div
                v-for="suggested of suggestedTasks"
                :key="suggested.id"
                class="w-full md:w-1/3 lg:w-1/3 px-2 pb-2"
              >
                <article
                  class="border border-gray-200 rounded-lg p-4 h-full flex-grow"
                >
                  <h6
                    class="text-2xs leading-4.5 font-semibold pb-1"
                  >
                    {{ suggested.name }}
                  </h6>
                  <div
                    class="text-xs leading-5 text-gray-500 pb-3 c-content"
                    v-html="$sanitize(suggested.body)"
                  ></div>
                  <div
                    class="text-xs font-medium leading-5 text-brand-500 cursor-pointer"
                    @click="addSuggested(suggested)"
                  >
                    + Add task
                  </div>
                </article>
              </div>
            </div>
          </div>
          <div
            v-else
            class="pt-3 pb-4 flex justify-center items-center"
          >
            <div
              class="ri-checkbox-multiple-blank-line text-3xl h-10 flex items-center text-gray-300"
            ></div>
            <div
              class="pl-6 text-sm leading-5 italic text-gray-400"
            >
              No tasks assigned to you at this moment
            </div>
          </div>
        </div>

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
import {
  onBeforeUnmount,
  ref,
  onMounted,
  computed
} from 'vue'
import { TaskService } from '@/modules/task/task-service'
import Message from '@/shared/message/message'
import { useStore } from 'vuex'
import AppTaskItem from '@/modules/task/components/task-item'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { TaskPermissions } from '@/modules/task/task-permissions'

const store = useStore()
const { currentUser, currentTenant } = mapGetters('auth')

const openForm = ref(false)
const selectedTask = ref(null)
const tasks = ref([])
const suggestedTasks = ref([])
const taskCount = ref(0)
const loading = ref(false)
const intitialLoad = ref(false)

const addTask = () => {
  openForm.value = true
  selectedTask.value = null
}

const editTask = (task) => {
  openForm.value = true
  selectedTask.value = task
}

const isTaskLocked = computed(
  () =>
    new TaskPermissions(
      currentTenant.value,
      currentUser.value
    ).lockedForCurrentPlan
)
const hasPermissionToTask = computed(
  () =>
    new TaskPermissions(
      currentTenant.value,
      currentUser.value
    ).read
)

const taskCreatePermission = computed(
  () =>
    new TaskPermissions(
      currentTenant.value,
      currentUser.value
    ).create
)

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadOpenTasks') {
    fetchTasks()
  }
  if (action.type === 'task/reloadSuggestedTasks') {
    fetchSuggestedTasks()
  }
  if (action.type === 'task/addTask') {
    addTask()
  }
  if (action.type === 'task/editTask') {
    editTask(action.payload)
  }
})

const addSuggested = (task) => {
  editTask({
    ...task,
    assignees: [currentUser.value]
  })
}

onMounted(() => {
  fetchSuggestedTasks()
  fetchTasks()
})

onBeforeUnmount(() => {
  storeUnsubscribe()
})

const fetchTasks = (loadMore = false) => {
  if (!intitialLoad.value) {
    loading.value = true
  }

  TaskService.list(
    {
      type: 'regular',
      status: 'in-progress',
      assignees: [currentUser.value.id]
    },
    'dueDate_ASC',
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
      intitialLoad.value = true
    })
}

const fetchSuggestedTasks = () => {
  TaskService.list(
    {
      type: 'suggested'
    },
    'createdAt_DESC',
    3,
    0
  )
    .then(({ rows }) => {
      suggestedTasks.value = rows
    })
    .catch(() => {
      Message.error('There was an error loading tasks')
    })
}
</script>

<style>
.widget-content {
  max-height: 420px;
}

.suggested {
  max-width: 282px;
}
</style>
