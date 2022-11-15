<template>
  <el-drawer
    v-model="model"
    :custom-class="`${customClass} ${
      hasBorder ? 'bordered' : ''
    }`"
    :show-close="false"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    :size="size"
    @close="onClose"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="flex grow justify-between items-center">
        <div class="h-fit">
          <div
            v-if="preTitle"
            class="text-gray-600 text-2xs"
          >
            {{ preTitle }}
          </div>
          <div class="flex items-center">
            <img
              v-if="preTitleImgSrc"
              :src="preTitleImgSrc"
              class="w-6 h-6 mr-2"
              :alt="preTitleImgAlt"
            />
            <h5
              :id="titleId"
              class="text-black"
              :class="titleClass"
            >
              {{ title }}
            </h5>
          </div>
          <slot name="belowTitle" />
        </div>
        <div class="flex gap-3 items-center">
          <slot name="header-label"></slot>
          <div class="ml-3">
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
      </div>
    </template>

    <template #default>
      <slot name="content"></slot>
    </template>
    <template v-if="showFooter" #footer>
      <slot name="footer"></slot>
    </template>
  </el-drawer>
</template>

<script>
export default {
  name: 'AppDrawer'
}
</script>
<script setup>
import { defineProps, computed, defineEmits } from 'vue'

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
  customClass: {
    type: String,
    default: () => ''
  },
  direction: {
    type: String,
    default: () => 'rtl'
  },
  size: {
    type: [String, Number],
    default: () => '40%'
  },
  showFooter: {
    type: Boolean,
    default: () => true
  },
  preTitleImgSrc: {
    type: String,
    default: () => null
  },
  preTitleImgAlt: {
    type: String,
    default: () => null
  },
  hasBorder: {
    type: Boolean,
    default: () => false
  }
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
