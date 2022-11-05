<template>
  <article class="pt-6 pb-5 border-t">
    <div class="flex">
      <div class="pr-5">
        <el-tooltip
          v-if="props.completed"
          effect="dark"
          content="Unmark as completed"
          placement="top"
        >
          <div
            class="ri-checkbox-circle-fill h-6 flex items-center text-xl text-gray-500 hover:text-gray-900 transition cursor-pointer"
            @click="unmarkAsComplete()"
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
            @click="markAsComplete()"
          >
            <div
              class="ri-checkbox-blank-circle-line h-6 flex items-center text-xl text-gray-300"
            />
            <div
              class="ri-checkbox-circle-line h-6 flex items-center text-xl absolute top-0 left-0 transition opacity-0 group-hover:opacity-100"
            ></div>
          </div>
        </el-tooltip>
      </div>
      <div
        class="flex-grow pt-0.5"
        :class="props.completed ? 'opacity-50' : ''"
      >
        <h6
          class="text-sm font-medium leading-5"
          :class="props.completed ? 'line-through' : ''"
        >
          Tellus commodo dui etiam vulputate neque neque.
        </h6>
        <p class="text-2xs leading-4.5 text-gray-500 pt-1">
          Tempor congue enim donec mauris, a, commodo tortor
          cras mi. Nam nulla lobortis sagittis eleifend amet
          a.
        </p>
        <div class="flex pt-4 items-center">
          <div
            class="mr-6 flex items-center"
            :class="dateClass"
          >
            <div
              class="ri-calendar-line text-base h-4 flex items-center"
            ></div>
            <p class="pl-2 text-2xs leading-4">
              Nov 10, 2022
              <span v-if="overdue">(overdue)</span>
            </p>
          </div>
          <div class="flex items-center mr-3">
            <app-avatar
              size="xxs"
              :entity="{ displayName: 'Gasper' }"
            />
            <p class="pl-2 text-2xs leading-4">
              November Echo
            </p>
          </div>
          <div class="flex items-center mr-3">
            <app-avatar
              size="xxs"
              :entity="{ displayName: 'Gasper' }"
            />
            <p class="pl-2 text-2xs leading-4">
              November Echo
            </p>
          </div>
        </div>
      </div>
      <div v-if="!completed" class="pl-4">
        <app-task-dropdown :task="null" />
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'AppTaskItem'
}
</script>

<script setup>
import { computed, defineProps } from 'vue'
import AppTaskDropdown from '@/modules/task/components/task-dropdown'

const props = defineProps({
  completed: {
    type: Boolean,
    required: false,
    default: false
  }
})

// TODO: logic for duesoon and overdue
const dueSoon = computed(() => false)
const overdue = computed(() => false)

const dateClass = computed(() => {
  if (overdue.value) {
    return 'px-1.5 py-1 text-red-900 bg-red-100 rounded-md'
  }
  if (dueSoon.value) {
    return 'px-1.5 py-1 text-yellow-900 bg-yellow-100 rounded-md'
  }
  return 'text-gray-500'
})

const markAsComplete = () => {
  // TODO: mark as complete
  console.log('mark as complete')
}
const unmarkAsComplete = () => {
  // TODO: mark as not complete
  console.log('mark as not complete')
}
</script>
