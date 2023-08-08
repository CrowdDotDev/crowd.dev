<template>
  <div v-if="hasPermissionToTask || isTaskLocked">
    <!-- header -->
    <div class="flex justify-between items-center pb-4">
      <h4 class="text-base leading-6 font-semibold">
        My open tasks ({{ tasks.length }})
      </h4>
      <el-tooltip
        v-if="tasks.length > 0 || suggestedTasks.length > 0"
        effect="dark"
        content="Add task"
        placement="top-start"
      >
        <el-button
          v-if="taskCreatePermission"
          class="btn btn--icon--sm btn--transparent h-8 w-8 !p-1.5"
          @click="addTask()"
        >
          <i
            class="ri-add-line text-lg leading-none text-gray-600"
          />
        </el-button>
      </el-tooltip>
    </div>
    <!-- tasks list -->
    <div>
      <div v-if="loading">
        <app-dashboard-task-item
          :loading="true"
          class="mb-4"
        />
        <app-dashboard-task-item
          :loading="true"
          class="mb-4"
        />
      </div>
      <div v-else>
        <app-dashboard-task-item
          v-for="task of tasks"
          :key="task.id"
          class="mb-4"
          :task="task"
        />
        <div v-if="tasks.length === 0">
          <div v-if="suggestedTasks.length > 0">
            <app-dashboard-task-suggested
              v-for="suggested of suggestedTasks"
              :key="suggested.id"
              :task="suggested"
              class="mb-4"
              @create="editTask($event)"
            />
          </div>
          <div
            v-else
            class="pt-2 pb-4 flex flex-col items-center"
          >
            <div
              class="ri-checkbox-multiple-blank-line text-3xl h-10 flex items-center text-gray-300"
            />
            <div
              class="pl-6 text-xs leading-4.5 italic text-gray-400 text-center pt-4 pb-3"
            >
              No tasks assigned to you at this moment
            </div>
            <el-button
              class="btn btn-brand--transparent btn--sm w-full leading-5 flex items-center"
              @click="addTask()"
            >
              <i
                class="ri-add-fill text-base text-brand-500"
              />
              <span class="text-brand-500">Add task</span>
            </el-button>
          </div>
        </div>

        <app-load-more
          :is-visible="tasks.length < taskCount"
          :is-loading="loadingTasks"
          :fetch-fn="fetchTasks(true)"
        />
      </div>
    </div>
  </div>
  <app-task-form
    v-model="openForm"
    :task="selectedTask"
    @close="openForm = false"
  />
</template>

<script setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  computed,
} from 'vue';
import { useStore } from 'vuex';
import AppTaskForm from '@/modules/task/components/task-form.vue';
import { TaskPermissions } from '@/modules/task/task-permissions';
import { TaskService } from '@/modules/task/task-service';
import Message from '@/shared/message/message';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import {
  SUGGESTED_TASKS_NO_INTEGRATIONS_FILTER,
  SUGGESTED_TASKS_FILTER,
} from '@/modules/task/store/constants';
import AppDashboardTaskSuggested from '@/modules/dashboard/components/task/dashboard-task-suggested.vue';
import AppDashboardTaskItem from '@/modules/dashboard/components/task/dashboard-task-item.vue';
import AppLoadMore from '@/shared/button/load-more.vue';

const store = useStore();
const { currentUser, currentTenant } = mapGetters('auth');
const { activeList: activeIntegrations } = mapGetters('integration');
const { doFetch: doFetchIntegrations } = mapActions('integration');

const openForm = ref(false);
const selectedTask = ref(null);
const tasks = ref([]);
const suggestedTasks = ref([]);
const taskCount = ref(0);
const loadingIntegrations = ref(false);
const loadingTasks = ref(false);
const loadingSuggestedTasks = ref(false);
const storeUnsubscribe = ref(() => null);

const loading = computed(() => (
  loadingIntegrations.value
    || loadingTasks.value
    || loadingSuggestedTasks.value
));

const addTask = () => {
  openForm.value = true;
  selectedTask.value = null;
};

const editTask = (task) => {
  openForm.value = true;
  selectedTask.value = task;
};

const isTaskLocked = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);
const hasPermissionToTask = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const taskCreatePermission = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).create,
);

const fetchTasks = (loadMore = false) => {
  loadingTasks.value = true;

  TaskService.list(
    {
      type: 'regular',
      status: 'in-progress',
      assignees: [currentUser.value.id],
    },
    'dueDate_ASC',
    20,
    loadMore ? tasks.value.length : 0,
  )
    .then(({ rows, count }) => {
      tasks.value = loadMore
        ? [...tasks.value, ...rows]
        : rows;
      taskCount.value = count;
    })
    .catch(() => {
      if (!loadMore) {
        tasks.value = [];
      }
      Message.error('There was an error loading tasks');
    })
    .finally(() => {
      loadingTasks.value = false;
    });
};

const fetchSuggestedTasks = () => {
  loadingSuggestedTasks.value = true;

  const filter = Object.keys(activeIntegrations.value).length > 1
    ? SUGGESTED_TASKS_NO_INTEGRATIONS_FILTER
    : SUGGESTED_TASKS_FILTER;

  TaskService.list(filter, 'createdAt_DESC', 3, 0)
    .then(({ rows }) => {
      suggestedTasks.value = rows;
    })
    .catch(() => {
      Message.error('There was an error loading tasks');
    })
    .finally(() => {
      loadingSuggestedTasks.value = false;
    });
};

onMounted(async () => {
  loadingIntegrations.value = true;
  await doFetchIntegrations();
  loadingIntegrations.value = false;

  storeUnsubscribe.value = store.subscribeAction(
    async (action) => {
      if (action.type === 'auth/doRefreshCurrentUser') {
        loadingIntegrations.value = true;
        await doFetchIntegrations();
        loadingIntegrations.value = false;

        fetchTasks();
        fetchSuggestedTasks();
      }
      if (action.type === 'task/reloadOpenTasks') {
        fetchTasks();
      }
      if (action.type === 'task/reloadSuggestedTasks') {
        fetchSuggestedTasks();
      }
      if (action.type === 'task/addTask') {
        addTask();
      }
      if (action.type === 'task/editTask') {
        editTask(action.payload);
      }
    },
  );

  fetchSuggestedTasks();
  fetchTasks();
});
onBeforeUnmount(() => {
  storeUnsubscribe.value();
});
</script>

<script>
export default {
  name: 'AppDashboardTask',
};
</script>
