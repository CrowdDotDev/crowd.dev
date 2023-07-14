<template>
  <el-dialog
    v-model="model"
    :close-on-click-modal="false"
    :append-to-body="true"
    :destroy-on-close="true"
    :show-close="false"
    :class="`${dialogSize} ${customClass}`"
    @close="onClose"
  >
    <template #header="{ close, titleId, titleClass }">
      <div
        v-if="showHeader"
        class="flex grow justify-between"
        :class="
          preTitle || hasActionBtn
            ? 'items-center'
            : 'items-start'
        "
      >
        <slot name="header">
          <div class="h-fit">
            <div
              v-if="preTitle"
              class="text-gray-600 text-2xs"
            >
              {{ preTitle }}
            </div>
            <div
              class="flex items-center"
              :class="{
                'h-6': showLoadingIcon,
              }"
            >
              <h5 :id="titleId" :class="titleClass">
                <span v-if="typeof title === 'string'">
                  {{ title }}
                </span>
                <component :is="title" v-else />
              </h5>
              <div
                v-if="showLoadingIcon"
                v-loading="true"
                class="app-page-spinner w-6 ml-4"
              />
            </div>
            <slot name="description" />
          </div>
        </slot>
        <div class="flex gap-3 items-center">
          <slot name="actionBtn" />
          <div class="ml-3">
            <el-button
              class="btn btn-link btn-link--xs btn-link--primary w-8 !h-8 hover:!no-underline group"
              @click="close"
            >
              <i
                class="ri-close-line text-lg text-gray-400 group-hover:text-brand-500"
              />
            </el-button>
          </div>
        </div>
      </div>
    </template>
    <slot name="content" />
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

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
    type: [String, Node, Object],
    required: true,
  },
  size: {
    type: String,
    default: () => 'large',
  },
  customClass: {
    type: String,
    default: () => '',
  },
  hasActionBtn: {
    type: Boolean,
    default: () => false,
  },
  showHeader: {
    type: Boolean,
    default: () => true,
  },
  showLoadingIcon: {
    type: Boolean,
    default: () => false,
  },
});

const dialogSize = computed(() => {
  if (props.size === 'small') {
    return 'el-dialog--sm';
  } if (props.size === 'medium') {
    return 'el-dialog--md';
  } if (props.size === 'extra-large') {
    return 'el-dialog--xl';
  } if (props.size === '2extra-large') {
    return 'el-dialog--2xl';
  }

  return 'el-dialog--lg';
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
  name: 'AppDialog',
};
</script>
