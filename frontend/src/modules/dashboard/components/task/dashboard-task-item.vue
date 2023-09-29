<template>
  <div>
    <article
      v-if="loading || !props.task"
      class="panel !p-4"
    >
      <app-loading
        class="mb-6"
        height="16px"
        width="140px"
        radius="4px"
      />
      <app-loading
        class="mb-2"
        height="12px"
        radius="4px"
      />
      <app-loading
        class="mb-2"
        height="12px"
        radius="4px"
      />
      <app-loading
        width="94px"
        height="12px"
        radius="4px"
      />
    </article>
    <article
      v-else
      class="panel !p-4 task"
      :class="{ closing }"
    >
      <div class="flex justify-between items-center pb-3">
        <div class="pr-5">
          <el-tooltip
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
        <app-task-dropdown :task="props.task">
          <template #trigger>
            <button
              class="btn p-1.5 rounder-md hover:bg-gray-100"
              type="button"
              @click.stop
            >
              <i
                class="text-lg ri-more-fill text-gray-400"
              />
            </button>
          </template>
        </app-task-dropdown>
      </div>
      <div>
        <h6 class="text-sm font-semibold leading-5 pb-2">
          {{ props.task.name }}
        </h6>
        <div
          ref="taskBody"
          class="text-xs leading-5 text-gray-500 c-content"
          :class="
            displayShowMore && !showMore
              ? `line-clamp-4`
              : ''
          "
          v-html="$sanitize(props.task.body)"
        />

        <!-- show more/less button -->
        <div
          v-if="displayShowMore"
          class="text-2xs text-brand-500 mt-3 cursor-pointer"
          @click.stop="showMore = !showMore"
        >
          Show {{ showMore ? 'less' : 'more' }}
        </div>

        <!-- related members -->
        <div
          v-if="
            props.task.members && props.task.members.length
          "
          class="pt-6"
        >
          <p
            class="text-2xs font-medium leading-4.5 text-gray-500 pb-2"
          >
            Related Contact(s):
          </p>
          <div class="flex flex-wrap">
            <router-link
              v-for="member of props.task.members"
              :key="member.id"
              :to="{
                name: 'memberView',
                params: { id: member.id },
              }"
              class="mr-2 mb-2 bg-gray-100 border group border-gray-200 rounded-md h-6 flex items-center px-1.5 cursor-pointer"
            >
              <app-avatar
                :entity="member"
                size="xxs"
                class="mr-2"
              />
              <p
                class="text-2xs leading-4 text-gray-900 group-hover:text-brand-500 transition"
                v-html="$sanitize(member.displayName)"
              />
            </router-link>
          </div>
        </div>

        <div
          v-if="
            props.task.members.length > 0
              && props.task.assignees.length > 0
          "
          class="border-b border-gray-200 pt-2"
        />
        <!-- assignee -->
        <div
          v-if="props.task.assignees.length"
          class="items-center pt-4"
        >
          <article
            v-for="assignee of props.task.assignees"
            :key="assignee.id"
            class="flex items-center pr-3 mb-2"
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
          </article>
        </div>
        <div v-if="props.task.dueDate" class="pt-2 flex">
          <div class="flex items-center" :class="dateClass">
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
    </article>
  </div>
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
    default: () => {},
  },
  loading: {
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
  name: 'AppDashboardTaskItem',
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
