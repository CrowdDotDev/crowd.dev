<template>
  <div
    class="flex mt-16"
    :class="{
      'justify-between': showPreviousStep,
      'justify-end': !showPreviousStep,
    }"
  >
    <el-button
      v-if="showPreviousStep"
      class="btn btn--transparent btn--lg"
      :disabled="loadingUpdateSettings"
      @click="emit('onStepChange', -1)"
    >
      <i class="ri-arrow-left-s-line mr-3 text-lg" /><span>Previous step</span>
    </el-button>

    <el-button
      class="btn btn--primary btn--lg"
      :disabled="
        isNextButtonDisabled || loadingUpdateSettings
      "
      :loading="loadingUpdateSettings"
      @click="
        showFinalStep
          ? emit('onSubmit')
          : emit('onStepChange', 1)
      "
    >
      <span>{{
        showFinalStep
          ? 'Start exploring Eagle Eye'
          : 'Next step'
      }}</span><i
        v-if="!showFinalStep"
        class="ri-arrow-right-s-line ml-3 text-lg"
      />
    </el-button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { mapState } from '@/shared/vuex/vuex.helpers';

const emit = defineEmits(['onStepChange', 'onSubmit']);
defineProps({
  showPreviousStep: {
    type: Boolean,
    default: false,
  },
  showFinalStep: {
    type: Boolean,
    default: false,
  },
  isNextButtonDisabled: {
    type: Boolean,
    default: false,
  },
});

const { loadingUpdateSettings } = mapState('eagleEye');
</script>
