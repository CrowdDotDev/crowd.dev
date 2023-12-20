<template>
  <a
    id="menu-system-status"
    href="https://status.crowd.dev/"
    target="_blank"
    rel="noopener noreferrer"
    class="rounded-md h-10 transition !text-gray-400 flex items-center justify-between group whitespace-nowrap
    flex-nowrap mx-1 hover:bg-gray-50 mb-2 cursor-pointer overflow-hidden"
  >
    <div class="flex items-center justify-between grow">
      <span class="text-gray-900 pl-3 text-xs"> System Status </span>
      <app-loading
        v-if="!status"
        height="1rem"
        width="6rem"
        radius="4px"
        class="mr-2"
      />
      <span
        v-else
        class="border-border text-foreground/70 inline-flex max-w-fit items-center gap-2 rounded-md border px-2.5 py-1 text-2xs mr-2"
      >
        <span class="text-gray-900">{{ label }}</span>
        <span className="relative flex h-2 w-2">
          <span
            v-if="status === Status.Operational"
            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 duration-1000"
            :class="color"
          />
          <span
            class="relative inline-flex h-2 w-2 rounded-full"
            :class="color"
          />
        </span>
      </span>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Status } from '@/modules/layout/types/SystemStatus';
import LayoutService from '@/modules/layout/layout-service';
import AppLoading from '@/shared/loading/loading-placeholder.vue';

const status = ref<Status>();
const props = defineProps<{
  checkStatus: Boolean;
}>();

const StatusDisplay = {
  [Status.Operational]: {
    label: 'Operational',
    color: 'bg-green-500',
  },
  [Status.DegradedPerformance]: {
    label: 'Degraded Performance',
    color: 'bg-yellow-500',
  },
  [Status.PartialOutage]: {
    label: 'Partial Outage',
    color: 'bg-yellow-500',
  },
  [Status.MajorOutage]: {
    label: 'Major Outage',
    color: 'bg-red-500',
  },
  [Status.Unknown]: {
    label: 'Unknown',
    color: 'bg-gray-500',
  },
  [Status.UnderMaintenance]: {
    label: 'Under Maintenance',
    color: 'bg-gray-500',
  },
  [Status.Incident]: {
    label: 'Incident',
    color: 'bg-yellow-500',
  },
} as const;

const label = computed(() => {
  if (!status.value) {
    return null;
  }

  return StatusDisplay[status.value].label;
});
const color = computed(() => {
  if (!status.value) {
    return null;
  }

  return StatusDisplay[status.value].color;
});

watch(
  () => props.checkStatus,
  (checkStatus) => {
    status.value = undefined;

    if (checkStatus) {
      LayoutService.getSystemStatus().then((response) => {
        status.value = response.status;
      });
    }
  },
);
</script>
