<template>
  <section class="py-6 border-t border-gray-200">
    <div class="flex justify-between items-center pb-3">
      <h4 class="text-base font-semibold">
        JSON
      </h4>
      <cr-button type="tertiary-gray" size="small" @click="copy">
        <i class="ri-file-copy-line" /> Copy
      </cr-button>
    </div>
    <pre class="border border-gray-100 bg-gray-50 rounded-md p-4 overflow-auto text-xs">{{ props.log }}</pre>
  </section>
</template>

<script setup lang="ts">
import CrButton from '@/ui-kit/button/Button.vue';
import { AuditLog } from '@/modules/lf/segments/types/AuditLog';

const props = defineProps<{
  log: AuditLog
}>();

const copy = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(props.log, null, 2));
  }
};
</script>

<script lang="ts">
export default {
  name: 'AppLfAuditLogsJson',
};
</script>
