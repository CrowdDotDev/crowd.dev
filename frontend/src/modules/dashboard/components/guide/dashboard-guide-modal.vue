<template>
  <app-dialog v-model="modalOpened" :title="guide?.title">
    <template #header>
      <div>
        <h5 class="text-lg font-semibold leading-8 pb-1">
          {{ guide?.title }}
        </h5>
        <p class="text-xs text-gray-600">
          {{ guide?.description }}
        </p>
      </div>
    </template>

    <template #content>
      <div class="px-6 pb-6">
        <div v-html="guide.loomHtml"></div>
      </div>
      <div
        v-if="guide.actionText"
        class="flex justify-end px-6 pb-6"
      >
        <el-button
          class="btn btn--primary btn--md"
          @click="guide.action()"
        >
          {{ guide.actionText }}
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script>
export default {
  name: 'AppDashboardGuideModal'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import AppDialog from '@/shared/dialog/dialog.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const guide = computed(() => props.modelValue)

const modalOpened = computed({
  get() {
    return props.modelValue !== null
  },
  set(value) {
    emit(
      'update:modelValue',
      value ? props.modelValue : null
    )
  }
})
</script>
