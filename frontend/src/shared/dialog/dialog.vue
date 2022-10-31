<template>
  <el-dialog
    v-model="model"
    :close-on-click-modal="false"
    :append-to-body="true"
    :destroy-on-close="true"
    :show-close="false"
    :custom-class="`${dialogSize} user-invite-dialog`"
    @close="onClose"
  >
    <template #header="{ close, titleId, titleClass }">
      <div
        class="flex grow justify-between"
        :class="{
          'items-center': preTitle || hasActionBtn
        }"
      >
        <div class="h-fit">
          <div
            v-if="preTitle"
            class="text-gray-600 text-2xs"
          >
            {{ preTitle }}
          </div>
          <h5 :id="titleId" :class="titleClass">
            {{ title }}
          </h5>
        </div>
        <div class="flex gap-6 items-center">
          <slot name="actionBtn"></slot>
          <el-button
            class="btn btn--transparent btn--xs w-8 !h-8"
            @click="close"
          >
            <i
              class="ri-close-line text-lg text-gray-400"
            ></i>
          </el-button>
        </div>
      </div>
    </template>
    <slot name="content"></slot>
  </el-dialog>
</template>

<script>
export default {
  name: 'AppDialog'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const emit = defineEmits(['update:modelValue', 'close'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: () => false
  },
  preTitle: {
    type: String,
    default: () => null
  },
  title: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: () => 'large'
  },
  customClass: {
    type: String,
    default: () => ''
  },
  hasActionBtn: {
    type: Boolean,
    default: () => false
  }
})

const dialogSize = computed(() => {
  if (props.size === 'extra-large') {
    return 'el-dialog--xl'
  } else if (props.size === '2extra-large') {
    return 'el-dialog--2xl'
  }

  return 'el-dialog--lg'
})

const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const onClose = () => {
  model.value = false
  emit('close')
}
</script>
