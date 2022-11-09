<template>
  <section class="panel px-5 pb-3">
    <div class="pb-6">
      <div class="flex items-center">
        <div
          class="h-6 w-6 rounded-md bg-purple-50 flex items-center justify-center"
        >
          <div
            class="ri-lightbulb-line text-sm h-4 flex items-center text-purple-500"
          ></div>
        </div>
        <h6 class="text-base leading-6 font-semibold pl-3">
          Suggestions
        </h6>
      </div>
    </div>
    <div class="-mx-5">
      <article
        v-for="task of incompleteTasks"
        :key="task.id"
        class="px-5 pt-4 pb-5 border-t border-gray-100"
      >
        <h6 class="text-2xs font-semibold leading-4.5 pb-1">
          {{ task.title }}
        </h6>
        <p class="text-xs leading-5 text-gray-600 pb-5">
          {{ task.description }}
        </p>
        <el-button
          class="btn btn--secondary btn--sm !py-2.5 w-full"
          @click="task.action()"
        >
          {{ task.buttonText }}
        </el-button>
      </article>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AppTaskSuggested'
}
</script>

<script setup>
import { computed, ref } from 'vue'
const suggestedTasks = ref([
  {
    id: 'integrations',
    title: 'Setup workspace',
    description: 'Connect with at least 2 integrations',
    buttonText: 'Manage integrations',
    action: () => {
      console.log('manage integrations')
    },
    completed() {
      return false
    }
  },
  {
    id: 'users',
    title: 'Setup workspace',
    description:
      'Invite a colleague to your community workspace',
    buttonText: 'Manage users',
    action: () => {
      console.log('Manage users')
    },
    completed() {
      return false
    }
  },
  {
    id: 'members',
    title: 'Influential members',
    description:
      'Reach out to members with over 10k followers (reach)',
    buttonText: 'Browse members',
    action: () => {
      console.log('Browse members')
    },
    completed() {
      return false
    }
  }
])

const incompleteTasks = computed(() =>
  suggestedTasks.value.filter((task) => !task.completed())
)
</script>
