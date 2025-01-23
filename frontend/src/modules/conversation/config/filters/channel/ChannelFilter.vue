<template>
  <lf-select-filter v-model="form" :config="props.config as SelectFilterConfig" :options="data.options || []" />
</template>

<script setup lang="ts">
import {
  computed, watch,
} from 'vue';
import LfSelectFilter from '@/shared/modules/filters/components/filterTypes/SelectFilter.vue';
import {
  SelectFilterConfig, SelectFilterOptionGroup,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { extractRepoNameFromUrl } from '@/utils/string';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { storeToRefs } from 'pinia';
import { lfIdentities } from '@/config/identities';

const props = defineProps<{
  modelValue: string,
  config: CustomFilterConfig,
  data: any,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string), (e: 'update:data', value: any),}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const data = computed({
  get: () => props.data,
  set: (value: any) => emit('update:data', value),
});

const activityStore = useActivityStore();
const { activityChannels } = storeToRefs(activityStore);

watch(() => activityChannels.value, () => {
  data.value.options = Object.entries(activityChannels.value).map(([platform, channels]): SelectFilterOptionGroup => ({
    label: lfIdentities[platform]?.name ?? platform,
    options: channels.map((channel) => ({
      value: channel,
      label: platform === 'github' ? extractRepoNameFromUrl(channel) : channel,
    })),
  }));
}, { immediate: true });
</script>
