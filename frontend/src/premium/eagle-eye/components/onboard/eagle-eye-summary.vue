<template>
  <div class="flex flex-col gap-6">
    <div class="flex gap-8">
      <img class="basis-1/3" />

      <div class="basis-2/3">
        <h6 class="text-gray-900">Discover</h6>
        <div class="text-xs text-gray-500 mt-2">
          Quas provident possimus id placeat ipsa id ut ea
          cum similique et. Quos error sint ut deserunt
          molestiae...
        </div>
      </div>
    </div>

    <div class="flex gap-8">
      <img class="basis-1/3" />

      <div class="basis-2/3">
        <h6 class="text-gray-900">Engage</h6>
        <div class="text-xs text-gray-500 mt-2">
          Quas provident possimus id placeat ipsa id ut ea
          cum similique et. Quos error sint ut deserunt
          molestiae...
        </div>
      </div>
    </div>

    <div class="flex gap-8">
      <img class="basis-1/3" />

      <div class="basis-2/3">
        <h6 class="text-gray-900">Grow</h6>
        <div class="text-xs text-gray-500 mt-2">
          Quas provident possimus id placeat ipsa id ut ea
          cum similique et. Quos error sint ut deserunt
          molestiae...
        </div>
      </div>
    </div>
  </div>

  <eagle-eye-footer
    :show-previous-step="true"
    :show-final-step="true"
    @on-step-change="
      (increment) => emit('onStepChange', increment)
    "
    @on-submit="emit('onSubmit')"
  />
</template>

<script setup>
import EagleEyeFooter from '@/premium/eagle-eye/components/onboard/eagle-eye-footer.vue'
import { defineEmits } from 'vue'

const emit = defineEmits(['onStepChange', 'onSubmit'])
</script>
