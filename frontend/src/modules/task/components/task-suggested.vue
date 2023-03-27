<template>
  <section v-if="tasks.length > 0" class="panel px-5 pb-3">
    <div class="pb-6">
      <div class="flex items-center">
        <div
          class="h-6 w-6 rounded-md bg-purple-50 flex items-center justify-center"
        >
          <div
            class="ri-lightbulb-line text-sm h-4 flex items-center text-purple-500"
          />
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
        <div
          class="text-xs leading-5 text-gray-600 pb-4 c-content"
          v-html="$sanitize(task.body)"
        />
        <el-button
          class="btn btn--secondary btn--sm !py-2.5 w-full"
          :disabled="!taskCreatePermission"
          @click="addTask(task)"
        >
          Add task
        </el-button>
      </article>
    </div>
  </section>
</template>

<script setup>
import {
  ref,
  onBeforeUnmount,
  defineExpose,
  computed,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import { TaskService } from '@/modules/task/task-service';
import Message from '@/shared/message/message';
import { TaskPermissions } from '@/modules/task/task-permissions';
import {
  SUGGESTED_TASKS_NO_INTEGRATIONS_FILTER,
  SUGGESTED_TASKS_FILTER,
} from '@/modules/task/store/constants';

const { currentUser, currentTenant } = mapGetters('auth');
const { editTask } = mapActions('task');
const { active: activeIntegrations } = mapGetters('integration');
const { doFetch: doFetchIntegrations } = mapActions('integration');

const store = useStore();

const tasks = ref([]);
const taskCount = ref(0);

const addTask = (task) => {
  editTask({
    ...task,
    assignees: [currentUser.value],
  });
};

const taskCreatePermission = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).create,
);

const fetchTasks = () => {
  const filter = activeIntegrations.value.length > 1
    ? SUGGESTED_TASKS_NO_INTEGRATIONS_FILTER
    : SUGGESTED_TASKS_FILTER;

  TaskService.list(filter, 'createdAt_DESC', 20, 0)
    .then(({ rows, count }) => {
      tasks.value = rows;
      taskCount.value = count;
    })
    .catch(() => {
      tasks.value = [];
      taskCount.value = 0;
      Message.error('There was an error loading tasks');
    });
};

const storeUnsubscribe = store.subscribeAction((action) => {
  if (action.type === 'task/reloadSuggestedTasks') {
    fetchTasks();
  }
});
onMounted(async () => {
  await doFetchIntegrations({});

  fetchTasks();
});

onBeforeUnmount(() => {
  storeUnsubscribe();
});

defineExpose({
  taskCount,
});
</script>

<script>
export default {
  name: 'AppTaskSuggested',
};
</script>
