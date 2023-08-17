<template>
  <section class="panel pt-5 pb-4">
    <div class="flex items-center justify-between pb-4">
      <h6 class="text-base leading-6 font-semibold">
        Open tasks ({{ openTasksCount }})
      </h6>
      <el-button
        v-if="taskCreatePermission"
        class="btn btn--primary btn--md font-medium"
        @click="addTask()"
      >
        Add task
      </el-button>
    </div>
    <div
      v-if="closedTasksCount > 0 || openTasksCount > 0"
      class="flex items-center justify-between pb-6"
    >
      <div class="flex text-xs text-gray-600">
        <div
          v-for="(t, ti) of tabs"
          :key="t.name"
          class="px-3 h-8 border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 cursor-pointer"
          :class="[
            tabClasses(t.name),
            {
              'border-r-0 rounded-l-md': ti === 0,
              'border-l-0 rounded-r-md':
                ti === tabs.length - 1,
            },
          ]"
          @click="changeTab(t)"
        >
          {{ t.label }}
        </div>
      </div>
      <app-task-sorting
        v-if="tasks.length > 1"
        @change="changeOrder($event)"
      />
    </div>
    <div class="-mx-6">
      <div v-if="loading">
        <app-task-item
          class="px-6"
          :loading="true"
        />
        <app-task-item
          class="px-6"
          :loading="true"
        />
      </div>
      <div v-else>
        <app-task-item
          v-for="task of tasks"
          :key="task.id"
          class="px-6"
          :task="task"
        />
        <app-load-more
          :is-visible="tasks.length < tasksCount"
          :is-loading="loading"
          :fetch-fn="() => fetchTasks(true)"
        />
        <div
          v-if="tasks.length === 0"
          class="pt-16 pb-14 flex justify-center items-center"
        >
          <div
            class="ri-checkbox-multiple-blank-line text-3xl text-gray-300 flex items-center h-10"
          />
          <p class="pl-6 text-sm text-gray-400 italic">
            {{ tab.emptyText }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import moment from 'moment';
import { useStore } from 'vuex';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import { TaskService } from '@/modules/task/task-service';
import Message from '@/shared/message/message';
import { TaskPermissions } from '@/modules/task/task-permissions';
import AppTaskSorting from '@/modules/task/components/task-sorting.vue';
import AppTaskItem from '@/modules/task/components/task-item.vue';
import AppLoadMore from '@/shared/button/load-more.vue';

const store = useStore();

const { addTask } = mapActions('task');
const {
  openTasksCount,
  closedTasksCount,
  myOpenTasksCount,
} = mapGetters('task');
const { currentUser, currentTenant } = mapGetters('auth');

const tabs = ref([
  {
    label: 'All',
    name: 'all',
    emptyText: 'No open tasks at this moment',
    filters: {
      type: 'regular',
      status: 'in-progress',
    },
  },
  {
    label: 'Assigned to me',
    name: 'mine',
    emptyText: 'No tasks assigned to you at this moment',
    filters: {
      type: 'regular',
      status: 'in-progress',
      assignees: [currentUser.value.id],
    },
  },
  {
    label: 'Overdue',
    name: 'overdue',
    emptyText: 'No overdue tasks at this moment',
    filters: {
      type: 'regular',
      status: 'in-progress',
      dueDate: {
        lt: moment().startOf('day').toISOString(),
      },
    },
  },
]);

const tasks = ref([]);
const taskCount = ref(0);
const loading = ref(false);
const intitialLoad = ref(false);

const tab = myOpenTasksCount.value > 0
  ? ref(tabs.value[1])
  : ref(tabs.value[0]);
const order = ref('createdAt_DESC');

const tabClasses = (tabName) => (tab.value.name === tabName
  ? 'bg-gray-100 font-medium text-gray-900'
  : 'bg-white');

const taskCreatePermission = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).create,
);

const fetchTasks = (loadMore = false) => {
  const filter = tab.value.filters;
  if (!intitialLoad.value) {
    loading.value = true;
  }

  TaskService.list(
    filter,
    order.value,
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
        taskCount.value = 0;
      }
      Message.error('There was an error loading tasks');
    })
    .finally(() => {
      loading.value = false;
      intitialLoad.value = true;
    });
};

const changeTab = (t) => {
  tab.value = t;
  fetchTasks();
};

const changeOrder = (orderBy) => {
  order.value = orderBy;
  fetchTasks();
};

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadOpenTasks') {
    fetchTasks();
  }
});

onBeforeUnmount(() => {
  storeUnsubscribe();
});
</script>

<script>
export default {
  name: 'AppTaskOpen',
};
</script>
