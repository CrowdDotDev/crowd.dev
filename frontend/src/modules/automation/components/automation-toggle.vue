<template>
  <div class="flex items-center">
    <el-switch
      :model-value="props.automation.state === 'active'"
      class="!grow-0 !ml-0"
      :disabled="!canEnable"
      :before-change="beforeChange"
      @change="handleChange"
    />
    <span class="ml-2 text-gray-900 text-sm">
      {{ props.automation.state === 'active' ? 'On' : 'Off' }}
    </span>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { useAutomationStore } from '@/modules/automation/store';
import { useStore } from 'vuex';
import { getWorkflowMax, showWorkflowLimitDialog } from '@/modules/automation/automation-limit';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { FeatureFlag } from '@/utils/featureFlag';
import { automationTypes } from '../config/automation-types';

const props = defineProps({
  automation: {
    type: Object,
    default: () => {},
  },
});

const store = useStore();

const { changePublishState } = useAutomationStore();

const { currentTenant } = mapGetters('auth');

const canEnable = computed(() => {
  const { type } = props.automation;

  if (automationTypes[type]?.enableGuard) {
    return props.automation.state === 'active' || automationTypes[type]?.enableGuard(props.automation, store);
  }

  return true;
});

const beforeChange = () => {
  if (props.automation.state === 'active') {
    return true;
  }

  const isFeatureEnabled = FeatureFlag.isFlagEnabled(
    FeatureFlag.flags.automations,
  );

  if (!isFeatureEnabled) {
    const planWorkflowCountMax = getWorkflowMax(
      currentTenant.value.plan,
    );

    showWorkflowLimitDialog({ planWorkflowCountMax });
  }

  return isFeatureEnabled;
};

const handleChange = (value) => {
  changePublishState(props.automation.id, value);
};

</script>

<script>
export default {
  name: 'AppAutomationToggle',
};
</script>
