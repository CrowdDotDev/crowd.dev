<template>
  <lfx-dropdown-select
    v-model="selectedIntegrationId"
    width="200px"
    :match-width="false"
    dropdown-class="max-h-80"
    placement="bottom-end"
  >
    <template #trigger>
      <lfx-dropdown-selector
        size="medium"
        type="filled"
      >
        <div class="flex items-center gap-1.5">
          <lf-icon
            name="grid-round-2"
            :size="20"
          />
          <span class="text-sm text-neutral-900 font-semibold">
            {{ selectedIntegration?.name || 'All integrations' }}
          </span>
          <lf-icon
            name="angle-down"
            :size="16"
            class="text-neutral-400"
          />
        </div>
      </lfx-dropdown-selector>
    </template>

    <template #default>
      <div class="sticky -top-1 z-10 bg-white w-full -mt-1 pt-1 flex flex-col gap-1">
        <!-- All integrations option -->
        <lfx-dropdown-item
          value="all"
          label="All integrations"
          @click="selectedIntegrationId = 'all'"
          :selected="selectedIntegrationId === 'all'"
          :class="{
            '!bg-blue-50': selectedIntegrationId === 'all',
          }"
        />
      </div>

      <lfx-dropdown-item
        v-for="integration in integrations"
        :key="integration.id"
        :value="integration.id"
        :label="integration.name"
        @click="selectIntegration(integration.id)"
        :selected="selectedIntegrationId === integration.id"
        :class="{
          '!bg-blue-50': selectedIntegrationId === integration.id,
        }"
      />
    </template>
  </lfx-dropdown-select>
</template>

<script setup lang="ts">
import {
  computed,
} from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfxDropdownSelect from '@/ui-kit/lfx/dropdown/dropdown-select.vue';
import LfxDropdownSelector from '@/ui-kit/lfx/dropdown/dropdown-selector.vue';
import LfxDropdownItem from '@/ui-kit/lfx/dropdown/dropdown-item.vue';
import { useOverviewStore } from '@/modules/admin/modules/overview/store/overview.store';
import { storeToRefs } from 'pinia';

const overviewStore = useOverviewStore();
const { selectedIntegrationId } = storeToRefs(overviewStore);

interface Integration {
  id: string;
  name: string;
}

const props = defineProps<{
  integrations: Integration[];
}>();

// Mock data for integrations (can be replaced with props.integrations)
const mockIntegrations: Integration[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'slack', name: 'Slack' },
  { id: 'discord', name: 'Discord' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'twitter', name: 'Twitter' },
];

const selectIntegration = (integrationId: string) => {
  selectedIntegrationId.value = integrationId;
};

const selectedIntegration = computed(() => {
  if (selectedIntegrationId.value === 'all') return null;
  const integrations = props.integrations || mockIntegrations;
  return integrations.find(i => i.id === selectedIntegrationId.value) || null;
});

</script>

<script lang="ts">
export default {
  name: 'AppLfIntegrationsFilter',
};
</script>
