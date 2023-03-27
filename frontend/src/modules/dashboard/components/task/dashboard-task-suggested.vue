<template>
  <article class="panel !p-4">
    <p
      class="text-2xs leading-4.5 font-medium text-gray-500 pb-2"
    >
      Suggestion
    </p>
    <h6 class="text-sm leading-5 font-semibold pb-2">
      {{ props.task.name }}
    </h6>
    <div
      class="text-xs leading-5 text-gray-500 pb-6 c-content"
      v-html="$sanitize(props.task.body)"
    />
    <div
      class="text-xs font-medium leading-5 text-brand-500 cursor-pointer"
      @click="addSuggested(props.task)"
    >
      + Add task
    </div>
  </article>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const props = defineProps({
  task: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const emit = defineEmits(['create']);

const { currentUser } = mapGetters('auth');
const addSuggested = (task) => {
  emit('create', {
    ...task,
    assignees: [currentUser.value],
  });
};
</script>

<script>
export default {
  name: 'AppDashboardTaskSuggested',
};
</script>
