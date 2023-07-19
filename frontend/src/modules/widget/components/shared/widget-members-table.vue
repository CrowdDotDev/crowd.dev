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
      <div
        class="flex gap-3 items-center col-span-3"
        :class="{
          'col-span-4': isDetailedView,
        }"
      >
        <app-avatar :entity="member" size="sm" />
        <div class="flex flex-col">
          <span class="font-medium text-xs text-gray-900" v-html="$sanitize(member.displayName)" />
          <span
            v-if="isDetailedView && showActiveDays"
            class="text-gray-500 text-2xs italic"
          >{{
            pluralize('day', member.activeDaysCount, true)
          }}
            active</span>
          <span
            v-else-if="
              member.organizations?.length
                && !isDetailedView
            "
            class="text-gray-500 text-2xs"
          >{{ member.organizations?.[0]?.name }}</span>
        </div>
      </div>

      <div
        v-if="!isDetailedView"
        class="text-xs text-gray-500 italic flex items-center col-span-2"
      >
        {{ member.activeDaysCount }} days active
      </div>

      <div class="flex gap-3 items-center">
        <div
          v-for="platform in Object.keys(
            member.username || {},
          )"
          :key="platform"
        >
          <app-platform-svg-icon
            :platform="platform"
            :tooltip-label="tooltipContent(platform)"
            :as-link="true"
            :username-handles="member.username[platform]"
            :show-handles-badge="true"
          />
        </div>
      </div>

      <div
        class="inline-flex items-center justify-end mr-4 invisible group-hover:visible font-medium text-2xs text-gray-600 gap-1 col-start-8"
      >
        <span v-if="!isDetailedView">Profile</span>
        <i class="ri-arrow-right-s-line" />
      </div>
    </router-link>
  </div>
</template>

<script setup>
import pluralize from 'pluralize';
import AppPlatformSvgIcon from '@/shared/platform/platform-svg-icon.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

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

const tooltipContent = (platform) => {
  const config = CrowdIntegrations.getConfig(platform) || {};

  return `${config.name || platform} profile`;
};

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
