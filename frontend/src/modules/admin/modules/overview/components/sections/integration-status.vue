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
        />
      </div>
    </div>

    <!-- Status chips -->
    <div class="flex gap-3 items-start">
      <div v-if="isPending" class="py-4 flex justify-center w-full">
        <lf-spinner size="1rem" />
      </div>
      <template v-else>
        <lfx-chip
          v-for="(config, key) in lfIntegrationStatusesTabs"
          :key="key"
          type="bordered"
          size="default"
          class="cursor-pointer hover:bg-neutral-50"
          @click="navigateTo(`/admin#integrations`, key)"
        >
          <lf-icon
            v-if="config.chipStatus?.icon || config.status.icon"
            :name="config.chipStatus?.icon || config.status.icon"
            :type="config.chipStatus?.iconType || config.status.iconType"
            :size="15"
            :class="config.chipStatus?.color || config.status.color"
          />
          <span class="text-sm text-neutral-900 font-normal">
            {{ config.tabs.text }}
          </span>
          <span class="text-sm text-neutral-900 font-semibold">
            {{ integrationStatusCount?.[key] || 0 }}
          </span>
        </lfx-chip>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfxChip from '@/ui-kit/lfx/chip/chip.vue';
import IntegrationsFilter from '@/modules/admin/modules/overview/components/fragments/integrations-filter.vue';
import { lfIntegrationStatusesTabs } from '@/modules/admin/modules/integration/config/status';
import { useRouter } from 'vue-router';
import { OVERVIEW_API_SERVICE } from '../../services/overview.api.service';
import { ToastStore } from '@/shared/message/notification';
import { useOverviewStore } from '@/modules/admin/modules/overview/store/overview.store';
import { storeToRefs } from 'pinia';
import { GlobalIntegrationStatusCount } from '../../types/overview.types';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';

const { 
  selectedIntegrationId,
  integrationStatusCount,
  selectedSubProjectId,
  selectedProjectId,
  selectedProjectGroupId,
} = storeToRefs(useOverviewStore());

const router = useRouter();

const params = computed(() => ({
  platform: selectedIntegrationId.value || undefined,
  segment: selectedSubProjectId.value || selectedProjectId.value || selectedProjectGroupId.value || undefined,
}));

const { data, isPending, isError } = OVERVIEW_API_SERVICE.fetchGlobalIntegrationStatusCount(params);

const navigateTo = (path: string, key: string) => {
  if (window && window.localStorage) {
    window.localStorage.setItem('integrationStatusFilter', key);
  }
  router.push(path);
};

watch(data, () => {
  if (data.value) {
  integrationStatusCount.value = data.value?.reduce((acc: Record<string, number>, item: GlobalIntegrationStatusCount) => {
      acc[item.status] = +item.count;
      return acc;
    }, {});
  }
}, { immediate: true });

watch(isError, () => {
  if (isError.value) {
    ToastStore.error('Failed to fetch global integration status count');
  }
});
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewIntegrationStatus',
};
</script>