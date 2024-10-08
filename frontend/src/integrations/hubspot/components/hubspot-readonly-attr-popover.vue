<template>
  <app-dialog
    v-model="model"
    title="Read-only attributes"
    size="large"
  >
    <template #header>
      <div class="flex gap-4">
        <span class="rounded-full bg-primary-50 p-4 w-9 h-9 flex items-center justify-center">
          <i class="ri-information-line font-medium text-lg text-primary-600 leading-none" />
        </span>
        <p class="text-sm text-gray-500 font-medium mt-1">
          The following attributes, auto-generated by LFX, are only mapped into HubSpot,
          and won't be overwritten if their value is updated on your HubSpot account.
        </p>
      </div>
    </template>
    <template #content>
      <section class="px-6 pb-4 -mt-2">
        <ul class="mx-18 mb-4 text-gray-900 font-semibold text-sm list-disc">
          <li v-for="(attribute, index) in attributes" :key="index">
            {{ attribute }}
          </li>
        </ul>
      </section>
      <footer class="flex justify-between py-4 px-6 items-center bg-gray-100 rounded-b-md">
        <el-checkbox
          v-model="doNotShow"
          class="filter-checkbox"
        >
          <span class="text-xs text-gray-900">Don't show this message again</span>
        </el-checkbox>
        <div>
          <el-button
            class="btn btn--primary btn--md btn--full"
            @click="onContinue"
          >
            Continue
          </el-button>
        </div>
      </footer>
    </template>
  </app-dialog>
</template>

<script setup>
import {
  defineEmits, defineProps, computed, ref,
} from 'vue';
import AppDialog from '@/shared/dialog/dialog.vue';

const emit = defineEmits(['update:modelValue', 'doNotShowModal', 'continue']);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: () => false,
  },
  attributes: {
    type: Array,
    default: () => [],
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const doNotShow = ref(false);

const onContinue = () => {
  model.value = false;
  if (doNotShow.value) {
    emit('doNotShowModal');
  }
  emit('continue');
};
</script>

<script>
export default {
  name: 'AppHubspotReadOnlyAttrPopover',
};
</script>
