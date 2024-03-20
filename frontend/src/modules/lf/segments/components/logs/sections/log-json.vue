<template>
  <section class="py-6 border-t border-gray-200">
    <div class="flex justify-between items-center pb-3">
      <h4 class="text-base font-semibold">
        JSON
      </h4>
      <cr-button :type="copied ? 'success-transparent' : 'tertiary-gray'" size="small" @click="copy">
        <template v-if="!copied">
          <i class="ri-file-copy-line" /> Copy
        </template>
        <template v-else>
          <i class="ri-checkbox-circle-fill" />Copied!
        </template>
      </cr-button>
    </div>
    <pre class="border border-gray-100 bg-gray-50 rounded-md p-4 overflow-auto text-xs">{{ props.log }}</pre>
  </section>
</template>

<script setup lang="ts">
import CrButton from '@/ui-kit/button/Button.vue';
import { AuditLog } from '@/modules/lf/segments/types/AuditLog';
import { ref } from 'vue';

const props = defineProps<{
  log: AuditLog
}>();

const copied = ref(false);

const copy = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(props.log, null, 2));
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1000);
  }
};
</script>

<script lang="ts">
export default {
  name: 'AppLfAuditLogsJson',
};
</script>
