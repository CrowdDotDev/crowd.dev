<template>
  <div
    class="flex mt-16"
    :class="{
      'justify-between': showPreviousStep,
      'justify-end': !showPreviousStep,
    }"
  >
    <lf-button
      v-if="showPreviousStep"
      type="primary-link"
      size="large"
      :disabled="loadingUpdateSettings"
      @click="emit('onStepChange', -1)"
    >
      <lf-icon name="chevron-left" :size="20" class="mr-3" /><span>Previous step</span>
    </lf-button>

    <lf-button
      type="primary"
      size="large"
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
          ? 'Start exploring Community Lens'
          : 'Next step'
      }}</span>
      <lf-icon v-if="!showFinalStep" name="chevron-right" :size="20" class="ml-3" />
    </lf-button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { mapState } from '@/shared/vuex/vuex.helpers';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

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
