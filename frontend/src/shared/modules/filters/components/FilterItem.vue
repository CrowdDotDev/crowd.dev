<template>
  <div class="flex items-center shadow rounded-md">
    <!-- Settings -->
    <el-popover
      v-model:visible="isOpen"
      teleported
      placement="bottom-start"
      width="320"
      trigger="click"
      popper-class="!p-0"
    >
      <template #reference>
        <div
          class="border border-gray-100 rounded-l-md h-8 flex items-center py-1 px-2 bg-white cursor-pointer hover:bg-gray-100 transition"
          :class="{ '!bg-gray-100': isOpen }"
        >
          <i class="text-base text-black mr-2" :class="config.iconClass" />
          <span
            class="text-xs text-gray-600 filter-item-text leading-6"
            v-html="$sanitize(
              (props.modelValue && config.itemLabelRenderer(props.modelValue, props.config.options, data))
                || `<span class='!text-gray-500'>${config.label}...</span>`,
            )"
          />
        </div>
      </template>

      <div>
        <component :is="getComponent" v-if="getComponent" v-model="form" v-model:data="data" :config="props.config" v-bind="props.config.options" />
      </div>
      <div class="flex justify-end items-center border-t py-3 px-4">
        <el-button class="btn btn--transparent btn--sm !h-8 mr-2" @click="close">
          Cancel
        </el-button>
        <el-button class="btn btn--primary btn--sm !h-8" :disabled="$v.$invalid" @click="apply">
          Apply
        </el-button>
      </div>
    </el-popover>

    <!-- Cancel -->
    <div
      class="border border-gray-100 rounded-r-md h-8 flex items-center p-2 bg-white -ml-px hover:bg-gray-100 transition cursor-pointer group"
      @click="emit('remove')"
    >
      <span class="ri-close-line text-base flex items-center h-4 text-gray-500 group-hover:text-gray-900" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { filterComponentByType } from '@/shared/modules/filters/config/filterComponentByType';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: string,
  open: string;
  config: FilterConfig,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: any): void, (e: 'remove'): void, (e: 'update:open', value: string): void}>();

const form = ref({});
const data = ref({});

const isOpen = computed({
  get() {
    return props.open === props.config.id;
  },
  set(value) {
    if (value) {
      emit('update:open', props.config.id);
    } else if (props.config.id === props.open) {
      emit('update:open', '');
    }
  },
});

const getComponent = computed(() => {
  const { type, component } = props.config;
  if (type === FilterConfigType.CUSTOM) {
    return component;
  }
  return filterComponentByType[props.config.type];
});

const apply = () => {
  emit('update:modelValue', { ...form.value });
  close();
};

const close = () => {
  isOpen.value = false;
};

const $v = useVuelidate();

watch(() => props.modelValue, (value) => {
  form.value = { ...value };
}, { immediate: true, deep: true });
</script>

<script lang="ts">
export default {
  name: 'CrFilterItem',
};
</script>

<style lang="scss">
.filter-item-text{
  b{
    @apply font-medium text-gray-900 mr-2;
  }
}
</style>
