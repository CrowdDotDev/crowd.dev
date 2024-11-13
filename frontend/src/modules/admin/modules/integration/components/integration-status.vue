<template>
  <div class="flex items-center text-medium gap-1.5 whitespace-nowrap">
    <template v-if="status">
      <lf-icon-old :name="status.status.icon" :class="status.status.color" :size="20" />
      <span class="font-semibold" :class="status.status.color">{{ status.status.text }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import { getIntegrationStatus } from '@/modules/admin/modules/integration/config/status';

const props = defineProps<{
  integration: any,
}>();

const status = computed(() => getIntegrationStatus(props.integration));

</script>

<script lang="ts">
export default {
  name: 'LfIntegrationStatus',
};
</script>
