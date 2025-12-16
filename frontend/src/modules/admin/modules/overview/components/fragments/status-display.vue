<template>
  <div class="flex flex-col gap-1">
    <template v-if="integrationStatus.status === 'connecting'">
      <app-integration-progress-wrapper :segments="[integrationStatus.segmentId]">
        <template #default="{ progress }">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-center gap-1.5">
              <lf-icon name="circle-notch" type="solid" class="text-primary-500 animate-spin" :size="16" />
              <span class="text-sm font-medium">In progress</span>
            </div>
            <app-integration-progress-bar
              :progress="progress.find((p) => p.platform === integrationStatus.platform)"
              :hide-bar="true"
              text-class="!text-tiny"
            />
          </div>
        </template>
      </app-integration-progress-wrapper>
    </template>
    <template v-else>
      <div class="flex items-center gap-1.5 mb-1">
        <lf-icon
          :name="status.status.icon"
          :size="16"
          :type="status.status.iconType"
          :class="status.status.color"
        />
        <span class="text-sm font-medium text-gray-900">{{ status.status.text }}</span>
      </div>
      <div class="text-xs text-gray-500">
        {{ integrationStatus.statusDetails }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { getIntegrationStatus } from '@/modules/admin/modules/integration/config/status';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import AppIntegrationProgressBar from '@/modules/integration/components/integration-progress-bar.vue';
import { IntegrationStatus } from '../../types/overview.types';

const props = defineProps<{
  integrationStatus: IntegrationStatus;
}>();

const status = computed(() => getIntegrationStatus(props.integrationStatus));
</script>
