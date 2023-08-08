<template>
  <div class="pt-6 pb-4">
    <div class="flex justify-between pb-6">
      <div class="flex text-xs text-gray-600">
        <div
          v-for="(t, ti) of tabs"
          :key="t.name"
          class="px-3 h-8 border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 cursor-pointer"
          :class="[
            tabClasses(t.name),
            {
              'border-r-0 rounded-l-md': ti === 0,
              'rounded-r-md': ti === tabs.length - 1,
            },
          ]"
          @click="changeTab(t)"
        >
          {{ t.label }}
        </div>
      </div>
      <button
        v-if="taskCreatePermission"
        type="button"
        class="btn btn--primary btn--sm !px-3"
        @click="addTask()"
      >
        Add task
      </button>
    </div>
    <div>
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
          :is-visible="tasks.length < taskCount"
          :is-loading="loading"
          :fetch-fn="fetchTasks(true)"
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
  </div>
  <app-task-form
    v-model="openForm"
    :task="selectedTask"
    @close="task = null"
  />
</template>

<script setup>
import {
  defineProps,
  onBeforeUnmount,
  ref,
  onMounted,
  defineExpose,
  computed,
} from 'vue';
import { useStore } from 'vuex';
import { TaskService } from '@/modules/task/task-service';
import Message from '@/shared/message/message';
import { TaskPermissions } from '@/modules/task/task-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppTaskItem from '@/modules/task/components/task-item.vue';
import AppTaskForm from '@/modules/task/components/task-form.vue';
import AppLoadMore from '@/shared/button/load-more.vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const store = useStore();
const { currentTenant, currentUser } = mapGetters('auth');

const tabs = ref([
  {
    label: 'Open',
    name: 'open',
    emptyText: 'No open tasks associated with this member',
    filters: {
      type: 'regular',
      status: 'in-progress',
      members: [props.member.id],
    },
  },
  {
    label: 'Completed',
    name: 'completed',
    emptyText:
      'No completed tasks associated with this member',
    filters: {
      type: 'regular',
      status: 'done',
      members: [props.member.id],
    },
  },
]);

const tab = ref(tabs.value[0]);
const tasks = ref([]);
const taskCount = ref(0);
const openTaskCount = ref(0);
const loading = ref(false);

const openForm = ref(false);
const selectedTask = ref(null);

const taskCreatePermission = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).create,
);

const addTask = () => {
  openForm.value = true;
  selectedTask.value = {
    members: [props.member],
  };
};

const editTask = (task) => {
  openForm.value = true;
  selectedTask.value = task;
};

const tabClasses = (tabName) => (tab.value.name === tabName
  ? 'bg-gray-100 font-medium text-gray-900'
  : 'bg-white');

const fetchTasks = (loadMore = false) => {
  const filter = tab.value.filters;
  loading.value = true;

  TaskService.list(
    filter,
    tab.value.name === 'open'
      ? 'dueDate_ASC'
      : 'createdAt_DESC',
    20,
    loadMore ? tasks.value.length : 0,
  )
    .then(({ rows, count }) => {
      tasks.value = loadMore
        ? [...tasks.value, ...rows]
        : rows;
      taskCount.value = count;
      if (tab.value.name === 'open') {
        openTaskCount.value = count;
      }
    })
    .catch(() => {
      if (!loadMore) {
        tasks.value = [];
        taskCount.value = 0;
        openTaskCount.value = 0;
      }
      Message.error('There was an error loading tasks');
    })
    .finally(() => {
      loading.value = false;
    });

  if (tab.value.name !== 'open') {
    TaskService.list(
      {
        type: 'regular',
        status: 'in-progress',
        members: [props.member.id],
      },
      '',
      1,
      0,
    ).then(({ count }) => {
      openTaskCount.value = count;
    });
  }
};

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadOpenTasks') {
    fetchTasks();
  }
  if (action.type === 'task/addTask') {
    addTask();
  }
  if (action.type === 'task/editTask') {
    editTask(action.payload);
  }
});

const changeTab = (t) => {
  tab.value = t;
  fetchTasks();
};

onMounted(() => {
  fetchTasks();
});

onBeforeUnmount(() => {
  storeUnsubscribe();
});

defineExpose({
  openTaskCount,
});
</script>

<script>
export default {
  name: 'AppMemberViewTasks',
};
</script>
