<template>
  <section class="px-6">
    <div class="flex items-center justify-between pb-4">
      <h6 class="text-base leading-6 font-semibold">
        Completed tasks ({{ tasks.length }})
      </h6>
      <div class="flex items-center">
        <div
          v-if="archivedTasksCount > 0"
          class="flex items-center cursor-pointer"
          @click="openArchivedTasks()"
        >
          <div
            class="ri-archive-line text-base text-gray-600 h-4 flex items-center"
          />
          <div
            class="pl-2 text-xs font-medium leading-5 text-gray-600"
          >
            Archived ({{ archivedTasksCount }})
          </div>
        </div>
        <app-task-closed-dropdown
          v-if="tasksCount > 0"
          class="ml-4"
        />
      </div>
    </div>
    <div>
      <div v-if="loading">
        <app-task-item :loading="true" />
        <app-task-item :loading="true" />
      </div>
      <div v-else>
        <app-task-item
          v-for="task of tasks"
          :key="task.id"
          :task="task"
        />
        <app-load-more
          :is-visible="tasks.length < tasksCount"
          :is-loading="loading"
          :fetch-fn="fetchTasks(true)"
        />
        <div
          v-if="tasks.length === 0"
          class="pt-16 pb-14 flex justify-center items-center"
        >
          <div
            class="ri-checkbox-multiple-line text-3xl text-gray-300 flex items-center h-10"
          />
          <p class="pl-6 text-sm text-gray-400 italic">
            No completed tasks yet
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { TaskService } from '@/modules/task/task-service';
import Message from '@/shared/message/message';
import {
  mapActions,
  mapMutations,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import AppTaskItem from '@/modules/task/components/task-item.vue';
import AppTaskClosedDropdown from '@/modules/task/components/task-closed-dropdown.vue';
import AppLoadMore from '@/shared/button/load-more.vue';

const store = useStore();

const { SET_CLOSED_TASK_COUNT } = mapMutations('task');
const { openArchivedTasks } = mapActions('task');
const { archivedTasksCount } = mapGetters('task');

const tasks = ref([]);
const tasksCount = ref(0);
const loading = ref(false);
const initialLoad = ref(false);

const fetchTasks = (loadMore = false) => {
  if (!initialLoad.value) {
    loading.value = true;
  }

  TaskService.list(
    {
      type: 'regular',
      status: 'done',
    },
    'updatedAt_DESC',
    20,
    loadMore ? tasks.value.length : 0,
  )
    .then(({ rows, count }) => {
      tasks.value = loadMore
        ? [...tasks.value, ...rows]
        : rows;
      tasksCount.value = count;
      SET_CLOSED_TASK_COUNT(count);
    })
    .catch(() => {
      if (!loadMore) {
        tasks.value = [];
        tasksCount.value = 0;
      }
      Message.error('There was an error loading tasks');
    })
    .finally(() => {
      loading.value = false;
      initialLoad.value = true;
    });
};

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadClosedTasks') {
    fetchTasks();
  }
});

onMounted(() => {
  fetchTasks();
});

onBeforeUnmount(() => {
  storeUnsubscribe();
});
</script>

<script>
export default {
  name: 'AppTaskClosed',
};
</script>
