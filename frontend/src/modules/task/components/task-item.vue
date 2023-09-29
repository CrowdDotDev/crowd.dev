<template>
  <article
    v-if="loading || !props.task"
    class="pt-6 pb-5 border-t border-gray-100"
  >
    <div class="flex">
      <div v-if="!hideCheck" class="pr-6">
        <app-loading
          height="20px"
          width="20px"
          radius="50%"
        />
      </div>
      <div class="pt-1">
        <app-loading
          class="mb-3"
          height="12px"
          width="300px"
          radius="2px"
        />
        <app-loading
          class="mb-8"
          height="12px"
          width="420px"
          radius="2px"
        />
        <div class="flex">
          <app-loading
            class="mr-6"
            height="12px"
            width="120px"
            radius="2px"
          />
          <app-loading
            height="12px"
            width="120px"
            radius="2px"
          />
        </div>
      </div>
    </div>
  </article>
  <article
    v-else
    class="pt-6 pb-5 border-t border-gray-100 task"
    :class="{ closing }"
  >
    <div class="flex">
      <div v-if="!hideCheck" class="pr-5">
        <el-tooltip
          v-if="completed"
          effect="dark"
          content="Unmark as completed"
          placement="top"
        >
          <div
            class="ri-checkbox-circle-fill h-6 flex items-center text-xl text-gray-500 hover:text-gray-900 transition cursor-pointer"
            @click="changeCompletion(false)"
          />
        </el-tooltip>
        <el-tooltip
          v-else
          effect="dark"
          content="Mark as completed"
          placement="top"
        >
          <div
            class="h-6 w-6 group relative cursor-pointer"
            @click="changeCompletion(true)"
          >
            <div
              class="ri-checkbox-blank-circle-line h-6 flex items-center text-xl text-gray-300"
            />
            <div
              class="ri-checkbox-circle-line h-6 flex items-center text-xl absolute top-0 left-0 transition opacity-0 group-hover:opacity-100"
            />
          </div>
        </el-tooltip>
      </div>
      <div
        class="flex-grow pt-0.5"
        :class="completed ? 'opacity-50' : ''"
      >
        <h6
          class="text-sm font-medium leading-5"
          :class="completed ? 'line-through' : ''"
        >
          {{ props.task.name }}
        </h6>
        <div
          ref="taskBody"
          class="text-2xs leading-4.5 text-gray-500 pt-1 c-content"
          :class="{
            'line-clamp-4': displayShowMore && !showMore,
          }"
          v-html="$sanitize(props.task.body)"
        />
        <div
          v-if="displayShowMore"
          class="text-2xs text-brand-500 mt-3 cursor-pointer"
          @click.stop="showMore = !showMore"
        >
          Show {{ showMore ? 'less' : 'more' }}
        </div>
        <div
          v-if="
            props.task.members && props.task.members.length
          "
          class="pt-5 flex flex-wrap items-center"
        >
          <p
            class="text-2xs font-semibold leading-5 text-gray-400 pr-3 mb-1"
          >
            Related Contact(s):
          </p>
          <router-link
            v-for="member of props.task.members"
            :key="member.id"
            :to="{
              name: 'memberView',
              params: { id: member.id },
            }"
            class="mr-2 mb-1 bg-gray-100 border group border-gray-200 rounded-md h-6 flex items-center px-1.5 cursor-pointer"
          >
            <app-avatar
              :entity="member"
              size="xxs"
              class="mr-2"
            />
            <p
              class="text-2xs leading-4 text-gray-900 group-hover:text-brand-500 transition"
            >
              {{ member.displayName }}
            </p>
          </router-link>
        </div>
        <div class="flex pt-4 items-center">
          <div class="pr-3 flex items-center">
            <div
              v-for="assignee of props.task.assignees"
              :key="assignee.id"
              class="flex items-center pr-3"
            >
              <app-avatar
                size="xxs"
                :entity="{
                  displayName:
                    assignee.fullName || assignee.email,
                  avatar: assignee.avatar,
                }"
              />
              <p class="pl-2 text-2xs leading-4">
                {{
                  assignee.fullName
                    || nameFromEmail(assignee.email)
                }}
              </p>
            </div>
          </div>

          <div
            v-if="props.task.dueDate"
            class="flex items-center"
            :class="dateClass"
          >
            <div
              class="ri-calendar-line text-base h-4 flex items-center"
            />
            <p class="pl-2 text-2xs leading-4">
              {{ formatDate(props.task.dueDate) }}
              <span
                v-if="
                  overdue
                    && props.task.status === 'in-progress'
                "
              >(overdue)</span>
            </p>
          </div>
        </div>
      </div>
      <div v-if="!completed" class="pl-4">
        <app-task-dropdown :task="props.task" />
      </div>
    </div>
  </article>
</template>

<script setup>
import {
  computed,
  defineProps,
  defineExpose,
  onMounted,
  ref,
} from 'vue';
import moment from 'moment';
import { TaskService } from '@/modules/task/task-service';
import Message from '@/shared/message/message';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import AppTaskDropdown from '@/modules/task/components/task-dropdown.vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';

const props = defineProps({
  task: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  hideCheck: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const { reloadTaskPage } = mapActions('task');

const showMore = ref(false);
const displayShowMore = ref(true);
const taskBody = ref(null);
const closing = ref(false);

const completed = computed(() => props.task && props.task.status === 'done');

const dueSoon = computed(
  () => props.task.dueDate
    && moment()
      .add(1, 'day')
      .startOf('day')
      .isAfter(moment(props.task.dueDate)),
);
const overdue = computed(() => (
  props.task.dueDate
    && moment()
      .startOf('day')
      .isAfter(moment(props.task.dueDate))
));

const dateClass = computed(() => {
  if (props.task.status === 'in-progress') {
    if (overdue.value) {
      return 'px-1.5 py-1 text-red-900 bg-red-100 rounded-md';
    }
    if (dueSoon.value) {
      return 'px-1.5 py-1 text-yellow-900 bg-yellow-100 rounded-md';
    }
  }

  return 'text-gray-500';
});

const formatDate = (date) => moment(date).format('MMM D, YYYY');

const nameFromEmail = (email) => {
  const [name] = email.split('@');
  return name;
};

const changeCompletion = (complete) => {
  closing.value = true;

  Promise.all([
    TaskService.update(props.task.id, {
      status: complete ? 'done' : 'in-progress',
    }),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 300);
    }),
  ])
    .then(() => {
      reloadTaskPage();
      Message.success(
        `Task has been marked as ${
          complete ? 'completed' : 'incomplete'
        }`,
      );
    })
    .catch(() => {
      closing.value = false;
      Message.error(
        `There was an error marking task as ${
          complete ? 'completed' : 'incomplete'
        }`,
      );
    });
};

onMounted(() => {
  const body = taskBody.value;
  if (body) {
    const height = body.clientHeight;
    const { scrollHeight } = body;
    displayShowMore.value = scrollHeight > height;
  } else {
    displayShowMore.value = false;
  }
});

defineExpose({
  taskBody,
});
</script>

<script>
export default {
  name: 'AppTaskItem',
};
</script>

<style lang="scss" scoped>
.task {
  max-height: 1000px;
  overflow: auto;

  &.closing {
    transition: 300ms all;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-top: 0;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
  }
}
</style>
