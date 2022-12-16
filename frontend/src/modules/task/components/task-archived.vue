<template>
  <app-drawer
    v-model="isExpanded"
    :title="`Archived tasks (${tasksCount})`"
    :show-close="false"
    size="480px"
    :title-class="'font-semibold'"
  >
    <template #belowTitle>
      <div
        v-if="taskDestroyPermission"
        class="text-2xs leading-4.5 text-brand-500 font-medium cursor-pointer"
        @click="deleteAllPermanently()"
      >
        Delete all permanently
      </div>
    </template>
    <template #content>
      <div class="-mt-4">
        <div v-if="loading">
          <app-task-item
            :loading="true"
            :hide-check="true"
          ></app-task-item>
          <app-task-item
            :loading="true"
            :hide-check="true"
          ></app-task-item>
        </div>
        <div v-else>
          <app-task-item
            v-for="task of tasks"
            :key="task.id"
            :task="task"
            :hide-check="true"
          />
          <div
            v-if="tasks.length < tasksCount"
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
          <div
            v-if="tasks.length === 0"
            class="pt-16 pb-14 flex justify-center items-center"
          >
            <div
              class="ri-archive-line text-3xl text-gray-300 flex items-center h-10"
            ></div>
            <p class="pl-6 text-sm text-gray-400 italic">
              No archived tasks
            </p>
          </div>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script>
export default {
  name: 'AppTaskArchived'
}
</script>

<script setup>
import {
  computed,
  defineProps,
  defineEmits,
  ref,
  onMounted,
  onBeforeUnmount
} from 'vue'
import AppTaskItem from '@/modules/task/components/task-item'
import { TaskService } from '@/modules/task/task-service'
import Message from '@/shared/message/message'
import { useStore } from 'vuex'
import {
  mapGetters,
  mapMutations
} from '@/shared/vuex/vuex.helpers'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import { TaskPermissions } from '@/modules/task/task-permissions'
import AppDrawer from '@/shared/drawer/drawer'
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const store = useStore()

const { SET_ARCHIVED_TASK_COUNT } = mapMutations('task')

const { currentTenant, currentUser } = mapGetters('auth')

const isExpanded = computed({
  get() {
    return props.modelValue
  },
  set(expanded) {
    emit('update:modelValue', expanded)
    if (!expanded) {
      emit('close')
    }
  }
})
const tasks = ref([])
const tasksCount = ref(0)
const loading = ref(false)
const initialLoad = ref(false)

const taskDestroyPermission = computed(
  () =>
    new TaskPermissions(
      currentTenant.value,
      currentUser.value
    ).destroy
)

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadArchivedTasks') {
    fetchTasks()
  }
})

onMounted(() => {
  fetchTasks()
})

onBeforeUnmount(() => {
  storeUnsubscribe()
})

const deleteAllPermanently = () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete archived tasks',
    message:
      'Are you sure you want to delete all archived tasks? You can’t undo this action.',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'ri-delete-bin-line'
  })
    .then(() => {
      return TaskService.batch('findAndDeleteAll', {
        filter: {
          status: 'archived'
        }
      })
    })
    .then(() => {
      fetchTasks()
      isExpanded.value = false
    })
}

const fetchTasks = (loadMore = false) => {
  if (!initialLoad.value) {
    loading.value = true
  }

  TaskService.list(
    {
      type: 'regular',
      status: 'archived'
    },
    'updatedAt_DESC',
    20,
    loadMore ? tasks.value.length : 0
  )
    .then(({ rows, count }) => {
      tasks.value = loadMore
        ? [...tasks.value, ...rows]
        : rows
      tasksCount.value = count
      SET_ARCHIVED_TASK_COUNT(count)

      if (tasksCount.value === 0) {
        isExpanded.value = false
      }
    })
    .catch(() => {
      if (!loadMore) {
        tasks.value = []
        tasksCount.value = 0
        isExpanded.value = false
      }
      Message.error('There was an error loading tasks')
    })
    .finally(() => {
      loading.value = false
      initialLoad.value = true
    })
}
</script>
