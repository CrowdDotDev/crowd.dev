<template>
  <cr-select-filter v-model="form" :config="props.config as SelectFilterConfig" :options="data.options || []" />
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, watch,
} from 'vue';
import CrSelectFilter from '@/shared/modules/filters/components/filterTypes/SelectFilter.vue';
import {
  SelectFilterConfig, SelectFilterOptionGroup,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { extractRepoNameFromUrl } from '@/utils/string';

const props = defineProps<{
  modelValue: string,
  config: CustomFilterConfig,
  data: any,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string), (e: 'update:data', value: any),}>();

const { currentTenant } = mapGetters('auth');

const form = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const data = computed({
  get: () => props.data,
  set: (value: any) => emit('update:data', value),
});

watch(() => currentTenant.value, (tenant: any) => {
  const activityChannels = tenant?.settings[0].activityChannels || {};

  data.value.options = Object.entries(activityChannels).map(([platform, channels]): SelectFilterOptionGroup => ({
    label: CrowdIntegrations.getConfig(platform).name,
    options: channels.map((channel) => ({
      value: channel,
      label: platform === 'github' ? extractRepoNameFromUrl(channel) : channel,
    })),
  }));
}, { immediate: true });
</script>
