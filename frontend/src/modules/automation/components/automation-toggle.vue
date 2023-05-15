<template>
  <div class="flex items-center">
    <el-switch
      :model-value="props.automation.state === 'active'"
      class="!grow-0 !ml-0"
      @change="handleChange"
    />
    <span class="ml-2 text-gray-900 text-sm">
      {{ props.automation.state === 'active' ? 'On' : 'Off' }}
    </span>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useAutomationStore } from '@/modules/automation/store';

const props = defineProps({
  automation: {
    type: Object,
    default: () => {},
  },
});

const { changePublishState } = useAutomationStore();

const handleChange = (value) => {
  changePublishState(props.automation.id, value);
};

</script>

<script>
export default {
  name: 'AppAutomationToggle',
};
</script>
