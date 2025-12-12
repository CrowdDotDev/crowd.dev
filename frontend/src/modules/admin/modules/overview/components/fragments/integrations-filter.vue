<template>
  <lfx-dropdown-select
    v-model="integrationId"
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
          <template v-if="!selectedIntegrationId || selectedIntegrationId === 'all'">
            <lf-icon name="grid-round-2" type="regular" :size="16" />
            All integrations
          </template>
          <template v-else>
            <img :src="selectedIntegration?.image" :alt="selectedIntegration?.name" class="min-w-4 h-4 object-contain">
            {{ selectedIntegration?.name }}
          </template>
        </div>
      </lfx-dropdown-selector>
    </template>

    <template #default>
      <div class="sticky -top-1 z-10 bg-white w-full -mt-1 pt-1 flex flex-col gap-1">
        <!-- All integrations option -->
        <lfx-dropdown-item
          value="all"
          label="All integrations"
          :selected="selectedIntegrationId === null"
          :class="{
            '!bg-blue-50': selectedIntegrationId === null,
          }"
          @click="selectedIntegrationId = null"
        />
      </div>

      <lfx-dropdown-item
        v-for="(integration, key) in lfIntegrations()"
        :key="key"
        :selected="selectedIntegrationId === key"
        @click="selectedIntegrationId = key"
      >
        <div class="flex items-center gap-2">
          <img :src="integration.image" :alt="integration.name" class="min-w-4 h-4 object-contain">
          {{ integration.name }}
        </div>
      </lfx-dropdown-item>
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
import { lfIntegrations } from '@/config/integrations';
import { storeToRefs } from 'pinia';

const overviewStore = useOverviewStore();
const { selectedIntegrationId } = storeToRefs(overviewStore);

const integrations = computed(() => lfIntegrations());
const integrationId = computed<string>({
  get: () => selectedIntegrationId.value || '',
  set: (value: string) => {
    selectedIntegrationId.value = value === 'all' || value === '' ? null : value;
  },
});

const selectedIntegration = computed(() => {
  if (selectedIntegrationId.value === 'all' || !selectedIntegrationId.value) return null;
  return integrations.value[selectedIntegrationId.value];
});

</script>

<script lang="ts">
export default {
  name: 'AppLfIntegrationsFilter',
};
</script>
