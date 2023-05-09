<template>
  <app-drawer
    v-model="isDrawerOpen"
    :title="title"
    size="600px"
  >
    <template #content>
      <div v-if="automation" class="-mt-4">
        <div class="bg-gray-50 p-4 rounded-md mb-8">
          <h5 class="text-sm font-medium leading-5 mb-0.5">
            {{ automation.name ?? translate(
              `entities.automation.triggers.${automation.trigger}`,
            ) }}
          </h5>
          <p class="text-2xs text-gray-500">
            {{
              translate(
                `entities.automation.triggers.${automation.trigger}`,
              )
            }}
          </p>
        </div>
        <app-automation-execution-list :automation="automation" />
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import AppDrawer from '@/shared/drawer/drawer.vue';
import { computed, defineProps } from 'vue';
import { i18n } from '@/i18n';
import AppAutomationExecutionList from '@/modules/automation/components/executions/automation-execution-list.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: false,
    default: () => null,
  },
});

const emit = defineEmits(['update:modelValue']);

const title = computed(() => {
  if (props.modelValue) {
    if (props.modelValue.type === 'webhook') {
      return 'Webhook executions';
    }
    if (props.modelValue.type === 'slack') {
      return 'Slack notification executions';
    }
  }
  return '';
});

const automation = computed({
  get() {
    return props.modelValue;
  },
  set() {
    emit('update:modelValue', null);
  },
});

const isDrawerOpen = computed({
  get() {
    return props.modelValue !== null;
  },
  set() {
    emit('update:modelValue', null);
  },
});

const translate = (key) => i18n(key);
</script>

<script>
export default {
  name: 'AppAutomationExecutions',
};
</script>
