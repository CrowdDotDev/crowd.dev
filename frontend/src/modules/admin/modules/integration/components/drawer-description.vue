<template>
  <p class="text-xs text-gray-500">
    {{ integration.description }}
    <a
      aria-label="Question"
      class="btn btn-link btn-link--primary hover:no-underline gap-1 "
      :href="integrationLink"
      target="_blank"
      rel="noopener noreferrer"
    >
      <lf-icon name="book-open" :size="16" />
      Learn more
    </a>
  </p>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { links } from '@/config/links';
import { computed } from 'vue';
import { lfIntegrations } from '@/config/integrations';

const props = defineProps<{
  integrationKey: string;
}>();

const integration = computed(() => lfIntegrations()[props.integrationKey]);
const integrationLink = computed(() => links.integrationLinks[props.integrationKey as keyof typeof links.integrationLinks]
|| links.integrations);
</script>
