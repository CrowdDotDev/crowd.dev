<template>
  <img
    :src="platformConfig.image"
    :alt="platformConfig.name"
    :class="imgClass"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps<{
    platform: string;
    size: string;
}>();

const platformConfig = computed(() => CrowdIntegrations.getConfig(props.platform));

const imgClass = computed(() => {
  if (props.size === 'large') {
    return 'max-h-[20px]';
  }

  return 'max-h-[16px]';
});
</script>

<script lang="ts">
export default {
  name: 'AppPlatformImg',
};
</script>
