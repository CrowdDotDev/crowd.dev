<template>
  <app-dialog
    v-model="model"
    :title="WarningIcon"
    size="small"
  >
    <template #content>
      <div class="px-6 pb-6">
        <h6 class="text-gray-900 -mt-2 mb-4">
          {{ title }}
        </h6>
        <div class="text-gray-500 text-sm mb-8">
          We received your request for a plan update and
          we'll get in touch soon
        </div>
        <el-button
          class="btn btn--primary btn--md btn--full"
          @click="onClose"
          >Continue</el-button
        >
      </div>
    </template>
  </app-dialog>
</template>

<script>
export default {
  name: 'AppPlanModal'
}
</script>

<script setup>
import { defineEmits, defineProps, computed, h } from 'vue'

const WarningIcon = h(
  'span',
  {
    class: `rounded-full bg-blue-100 w-10 h-10 flex items-center justify-center`
  },
  [
    h(
      'i',
      {
        class:
          'ri-error-warning-line text-lg text-blue-600 leading-none'
      },
      []
    )
  ]
)

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: () => false
  }
})

const model = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  }
})

const onClose = () => {
  model.value = false
}
</script>
