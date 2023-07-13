<template>
  <div class="hover:cursor-pointer" @click="onClick">
    <div
      class="bg-white p-5 rounded-lg shadow hover:shadow-md h-full border border-gray-200"
    >
      <div class="flex items-center justify-between mb-8">
        <div
          class="rounded-md h-10 w-10 flex items-center justify-center"
          :class="template.color"
        >
          <i
            class="text-white text-lg"
            :class="template.icon"
          />
        </div>
      </div>
      <div class="text-gray-900 text-base font-medium mb-3">
        {{ template.name }}
      </div>
      <div class="text-gray-500 text-xs">
        {{ template.description }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  template: {
    type: Object,
    required: true,
  },
});

const onClick = () => {
  router.push({
    name: 'reportTemplate',
    params: {
      id: props.template.id,
    },
  });
};
</script>
