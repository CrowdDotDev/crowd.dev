<template>
  <lf-table class="!overflow-visible" show-hover>
    <thead>
      <tr>
        <lf-table-head class="pl-2 w-[34%]">
          Project
        </lf-table-head>
        <lf-table-head class="pl-3 w-[22%]">
          Collection(s)
        </lf-table-head>
        <lf-table-head class="pl-3 min-w-[22%]">
          Associated company
        </lf-table-head>
        <lf-table-head class="pl-3 min-w-[15%]">
          Enabled
        </lf-table-head>
        <lf-table-head class="w-[7%]" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="project of projects" :key="project.id">
        <lf-table-cell class="pl-2">
          <div class="flex items-center">
            <div class="inline-flex flex-wrap overflow-wrap items-center">
              <lf-avatar
                :src="project.logoUrl"
                :name="project.name"
                :size="24"
                class="!rounded-md border border-gray-200 mr-3"
              />
              <span class="text-black text-sm font-semibold line-clamp-2 w-auto">
                {{ project.name }}
              </span>
            </div>
          </div>
        </lf-table-cell>

        <lf-table-cell>
          <app-lf-project-column :icon="'rectangle-history'" :title="'collections'" :projects="project.collections" />
        </lf-table-cell>

        <lf-table-cell class="pl-2">
          <div class="border border-gray-200 rounded-[100px] w-fit px-2 py-1 bg-white flex items-center">
            <lf-avatar
              :src="project.organization.logoUrl"
              :name="project.organization.name"
              :size="24"
              class="!rounded-md border border-gray-200"
            />
            <span class="ml-2 text-gray-900 text-xs">{{ project.organization.name }}</span>
          </div>
        </lf-table-cell>

        <lf-table-cell class="pl-2">
          <lf-switch :model-value="project.enabled" :size="'small'" />
        </lf-table-cell>

        <lf-table-cell class="pr-2 flex justify-end">
          <lf-insights-project-dropdown
            :id="project.id"
            @on-edit-project="emit('onEditProject', project.id)"
            @on-delete-project="emit('onDeleteProject', project.id)"
          />
        </lf-table-cell>
      </tr>
    </tbody>
  </lf-table>
</template>

<script setup lang="ts">
import LfTable from '@/ui-kit/table/Table.vue';
import LfTableCell from '@/ui-kit/table/TableCell.vue';
import LfTableHead from '@/ui-kit/table/TableHead.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import AppLfProjectColumn from '@/shared/project-column/lf-project-column.vue';
import LfSwitch from '@/ui-kit/switch/Switch.vue';
import { InsightsProjectModel } from '../models/insights-project.model';
import LfInsightsProjectDropdown from './lf-insights-projects-dropdown.vue';

const emit = defineEmits<{(e: 'onEditProject', id: string): void,
  (e: 'onDeleteProject', id: string): void,
}>();

defineProps<{
  projects: InsightsProjectModel[],
}>();

</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectsTable',
};
</script>
