<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Header with title and dropdown -->
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center">
        <h2 class="text-xl font-semibold text-black font-primary">
          Integration status
        </h2>
      </div>
      <div class="flex items-center">
        <integrations-filter
          ref="integrationsFilterRef"
          :integrations="mockIntegrations"
        />
      </div>
    </div>

    <!-- Status chips -->
    <div class="flex gap-3 items-start">
      <lfx-chip
        v-for="status in statusChips"
        :key="status.key"
        type="bordered"
        size="default"
      >
        <lf-icon
          v-if="status.icon"
          :name="status.icon"
          :size="15"
          :class="status.iconClass"
        />
        <span class="text-sm text-neutral-900 font-normal">
          {{ status.label }}
        </span>
        <span class="text-sm text-neutral-900 font-semibold">
          {{ status.count }}
        </span>
      </lfx-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
} from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfxChip from '@/ui-kit/lfx/chip/chip.vue';
import IntegrationsFilter from '@/modules/admin/modules/overview/components/fragments/integrations-filter.vue';
import { lfIntegrationStatusesTabs } from '@/modules/admin/modules/integration/config/status';

interface Integration {
  id: string;
  name: string;
}

// Mock data for integrations
const mockIntegrations: Integration[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'slack', name: 'Slack' },
  { id: 'discord', name: 'Discord' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'twitter', name: 'Twitter' },
];

// Mock data for status counts
const mockStatusCounts = {
  done: 240,
  connecting: 4,
  waitingForAction: 2,
  error: 1,
  notConnected: 126,
};

const integrationsFilterRef = ref();

const statusChips = computed(() => {
  return Object.entries(lfIntegrationStatusesTabs).map(([key, config]) => {
    let iconClass = 'shrink-0';
    let icon = '';

    // Map status to icons and colors based on the design
    switch (key) {
      case 'done':
        iconClass += ' text-green-500';
        icon = 'check-circle';
        break;
      case 'connecting':
        iconClass += ' text-blue-500';
        icon = 'clock';
        break;
      case 'waitingForAction':
        iconClass += ' text-orange-500';
        icon = 'triangle-exclamation';
        break;
      case 'error':
        iconClass += ' text-red-600';
        icon = 'circle-exclamation';
        break;
      case 'notConnected':
        iconClass += ' text-neutral-900';
        icon = 'link-simple-slash';
        break;
    }

    return {
      key,
      label: config.tabs.text,
      count: mockStatusCounts[key as keyof typeof mockStatusCounts] || 0,
      icon,
      iconClass,
    };
  });
});
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewIntegrationStatus',
};
</script>