<template>
  <teleport to="body">
    <el-drawer
      v-model="model"
      :class="`${customClass} ${
        hasBorder ? 'bordered' : ''
      } ${
        hasPadding ? '' : 'no-padding'
      }`"
      :show-close="false"
      :destroy-on-close="true"
      :close-on-click-modal="false"
      :size="size"
      :z-index="zIndex"
      @close="onClose"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="flex grow justify-between items-start">
          <slot name="header">
            <div class="h-fit">
              <div
                v-if="preTitle"
                class="text-gray-600 text-2xs"
              >
                {{ preTitle }}
              </div>
              <div class="flex items-center">
                <slot name="beforeTitle" />
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
          </slot>

          <div class="flex gap-3 items-center">
            <slot name="header-label" />
            <div class="ml-3">
              <lf-button
                type="primary-link"
                size="tiny"
                class="w-8 !h-8 hover:!no-underline group"
                @click="close"
              >
                <lf-icon name="xmark" :size="20" class="text-gray-400 group-hover:text-primary-500" />
              </lf-button>
            </div>
          </div>
        </div>
      </template>

      <template #default>
        <slot name="content" />
      </template>
      <template v-if="showFooter" #footer>
        <slot name="footer" />
      </template>
    </el-drawer>
  </teleport>
</template>

<script setup>
import { defineProps, computed, defineEmits } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { number } from 'yup';

const emit = defineEmits(['update:modelValue', 'close']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: () => false,
  },
  preTitle: {
    type: String,
    default: () => null,
  },
  title: {
    type: String,
    required: true,
  },
  customClass: {
    type: String,
    default: () => '',
  },
  direction: {
    type: String,
    default: () => 'rtl',
  },
  size: {
    type: [String, Number],
    default: () => '40%',
  },
  showFooter: {
    type: Boolean,
    default: () => true,
  },
  hasBorder: {
    type: Boolean,
    default: () => false,
  },
  hasPadding: {
    type: Boolean,
    default: () => true,
  },
  zIndex: {
    type: number,
    default: () => 2004,
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const onClose = () => {
  model.value = false;
  emit('close');
};
</script>

<script>
export default {
  name: 'AppDrawer',
};
</script>
