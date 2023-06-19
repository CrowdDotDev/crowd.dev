<template>
  <div class="hover:cursor-pointer" @click="onClick">
    <div
      class="bg-white p-5 rounded-lg shadow hover:shadow-md h-full"
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

        <div class="flex items-center gap-3">
          <div
            v-if="template.public"
            class="text-green-600 text-xs flex items-center gap-1"
          >
            <i class="ri-global-line" /><span>Public</span>
          </div>
          <app-report-template-dropdown
            v-if="template.public"
            :report="{
              id: template.id,
              public: template.public,
            }"
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
import AppReportTemplateDropdown from '@/modules/report/components/templates/report-template-dropdown.vue';

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
      segmentId: props.template.segmentId,
    },
  });
};
</script>
