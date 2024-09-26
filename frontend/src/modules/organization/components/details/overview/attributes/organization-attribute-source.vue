<template>
  <p v-if="source" class="text-tiny text-gray-400">
    Source: <span v-html="$sanitize(source)" />
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { isEqual } from 'lodash';

const props = defineProps<{
  values: Record<string, any>,
}>();

const source = computed(() => {
  if (!props.values) {
    return null;
  }
  const defaultValue: string | undefined = props.values.default;
  let sources = Object.keys(props.values)
    .filter((key) => !['default'].includes(key) && props.values[key].some((value: any) => isEqual(value, defaultValue)));
  if (!props.values.default) {
    sources = Object.keys(props.values);
  }

  if (sources.length === 0) {
    return null;
  }

  // Sort that integrations are first, then others like enrichment and last is custom
  const prioritySortedSources = sources.sort((a, b) => {
    const aConfig = !!CrowdIntegrations.getConfig(a)?.name;
    const bConfig = !!CrowdIntegrations.getConfig(b)?.name;

    if (aConfig && !bConfig) return -1;
    if (!aConfig && bConfig) return 1;

    return 0;
  });
  const selectedSource = prioritySortedSources[0];
  return CrowdIntegrations.getPlatformsLabel([selectedSource]);
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationAttributeSource',
};
</script>
