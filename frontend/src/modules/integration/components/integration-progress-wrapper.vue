<template>
  <slot :progress="progress" :progress-error="progressError" />
</template>

<script setup lang="ts">
import {
  onMounted, onUnmounted, ref, watch,
} from 'vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import { IntegrationProgress } from '@/modules/integration/types/IntegrationProgress';

const props = withDefaults(defineProps<{
  interval?: number
  segments?: string[]
}>(), {
  interval: 10,
  segments: () => ([]),
});

const progress = ref<IntegrationProgress | null>(null);
const progressError = ref(false);

const intervalInstance = ref<any>(null);

const fetchUpdates = () => {
  IntegrationService.fetchIntegrationsProgress(props.segments)
    .then((data: IntegrationProgress) => {
      progress.value = data;
      if (data.length === 0) {
        clearInterval(intervalInstance.value);
      }
    })
    .catch(() => {
      progress.value = null;
      progressError.value = true;
      clearInterval(intervalInstance.value);
    });
};

watch(() => props.segments, () => {
  fetchUpdates();
}, { deep: true });

onMounted(() => {
  fetchUpdates();
  intervalInstance.value = setInterval(() => {
    fetchUpdates();
  }, props.interval * 1000);
});

onUnmounted(() => {
  clearInterval(intervalInstance.value);
});
</script>

<script lang="ts">
export default {
  name: 'AppIntegrationProgressWrapper',
};
</script>
