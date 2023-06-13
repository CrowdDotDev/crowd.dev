<template>
  <cr-select-filter v-model="form" :config="props.config as SelectFilterConfig" :options="data.options || []" />
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, watch,
} from 'vue';
import CrSelectFilter from '@/shared/modules/filters/components/filterTypes/SelectFilter.vue';
import {
  SelectFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useStore } from 'vuex';

const props = defineProps<{
  modelValue: string
  config: CustomFilterConfig,
  data: any,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string), (e: 'update:data', value: any),}>();

const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);
const store = useStore();

const activeIntegrations = computed<string[]>(() => CrowdIntegrations.mappedEnabledConfigs(
  store,
).filter((integration) => integration.status).map((integration) => integration.platform));

const form = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const data = computed({
  get: () => props.data,
  set: (value: any) => emit('update:data', value),
});

watch(() => types, (typesValue: any) => {
  console.log(activeIntegrations);

  const platformsOptions = Object.entries(typesValue.value.default)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([platform, _]) => activeIntegrations.value.includes(platform))
    .map(([platform, activityTypes]: [string, any]) => ({
      label: CrowdIntegrations.getConfig(platform)?.name ?? platform,
      options: Object.entries(activityTypes).map(([activityType, activityTypeData]) => ({
        label: `${activityTypeData.display.short.charAt(0).toUpperCase()}${activityTypeData.display.short.substring(1).toLowerCase()}`,
        value: `${platform}:${activityType}`,
      })),
    }));

  const customOptions = Object.entries(typesValue.value.custom)
    .map(([platform, activityTypes]: [string, any]) => ({
      label: CrowdIntegrations.getConfig(platform)?.name ?? platform,
      options: Object.entries(activityTypes).map(([activityType, activityTypeData]) => ({
        label: `${activityTypeData.display.short.charAt(0).toUpperCase()}${activityTypeData.display.short.substring(1).toLowerCase()}`,
        value: `${platform}:${activityType}`,
      })),
    }));

  data.value.options = [
    ...platformsOptions,
    ...customOptions,
  ];
}, { immediate: true });

</script>
