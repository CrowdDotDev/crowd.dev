<template>
  <div :class="{ 'my-8': !isDetailedView }">
    <div v-if="isDetailedView">
      <div class="flex justify-between items-center mb-2">
        <div
          class="uppercase text-2xs text-gray-400 font-semibold"
        >
          Contributor
        </div>
        <el-button
          class="btn btn-link btn-link--primary !h-8"
          @click="onExportClick"
        >
          <i class="ri-file-download-line" /><span>Export CSV</span>
        </el-button>
      </div>
      <el-divider class="!my-0 border-gray-200" />
    </div>
    <router-link
      v-for="member in list"
      :key="member.id"
      target="_blank"
      class="h-14 border-b border-gray-100 last:border-none grid grid-cols-8 gap-4 hover:bg-gray-50 hover:cursor-pointer group"
      :to="{
        name: 'memberView',
        params: { id: member.id },
        query: { projectGroup: selectedProjectGroup?.id },
      }"
      @click="onRowClick"
    >
      <app-widget-table-row
        :member="member"
        :is-detailed-view="isDetailedView"
        :show-active-days="showActiveDays"
      />
    </router-link>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { defineProps, defineEmits } from 'vue';
import AppWidgetTableRow from './widget-members-table-row.vue';

const emit = defineEmits(['onRowClick', 'onExportClick']);
defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  isDetailedView: {
    type: Boolean,
    default: false,
  },
  showActiveDays: {
    type: Boolean,
    default: false,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const onRowClick = () => {
  emit('onRowClick');
};

const onExportClick = () => {
  emit('onExportClick');
};
</script>

<script>
export default {
  name: 'AppWidgetTable',
};
</script>
