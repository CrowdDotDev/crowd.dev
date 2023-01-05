<template>
  <router-link
    :to="{
      path: `reports/template/${template.id}`
    }"
  >
    <div class="bg-white p-5 rounded-lg shadow">
      <div class="flex items-center justify-between mb-8">
        <div
          class="rounded-md h-10 w-10 flex items-center justify-center"
          :class="template.color"
        >
          <i
            class="text-white text-xl ri-account-circle-line"
          />
        </div>

        <div class="flex items-center gap-3">
          <div
            v-if="template.public"
            class="text-green-600 text-xs flex items-center gap-1"
          >
            <i :class="template.icon" /><span>Public</span>
          </div>
          <app-report-template-dropdown
            v-if="template.public"
            :report="{ public: template.public }"
          ></app-report-template-dropdown>
        </div>
      </div>
      <div class="text-gray-900 text-base font-medium mb-3">
        {{ template.name }}
      </div>
      <div class="text-gray-500 text-xs">
        {{ template.description }}
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { defineProps } from 'vue'
import AppReportTemplateDropdown from '@/modules/report/components/templates/report-template-dropdown.vue'

defineProps({
  template: {
    type: Object,
    required: true
  }
})
</script>
