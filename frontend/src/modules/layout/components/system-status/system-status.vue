<template>
  <span class="border-border text-foreground/70 inline-flex max-w-fit items-center gap-2 rounded-md border px-2.5 py-1 text-2xs">
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Status } from '@/modules/layout/types/SystemStatus';

const props = defineProps<{
    status: Status
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
} as const;

const label = computed(() => StatusDisplay[props.status].label);
const color = computed(() => StatusDisplay[props.status].color);

</script>
