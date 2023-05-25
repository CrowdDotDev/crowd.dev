<template>
  <div>
    <el-button-group>
      <!-- Settings -->
      <el-popover
        v-model:visible="isOpen"
        teleported
        placement="bottom-start"
        width="320"
        trigger="click"
      >
        <template #reference>
          <el-button ref="chip" class="btn btn--bordered !h-8 p-2 !border !outline-none font-medium text-xs">
            <span
              v-html="$sanitize(
                (props.modelValue && config.itemLabelRenderer(props.modelValue, props.config.options))
                  || `<b>${config.label}:</b> ...`,
              )"
            />
          </el-button>
        </template>

        <div class="px-1">
          <component :is="getComponent" v-if="getComponent" v-model="form" :config="props.config" v-bind="props.config.options" />
        </div>
        <div class="flex justify-end items-center border-t pt-2">
          <el-button class="btn btn--transparent btn--sm mr-2" @click="close">
            Cancel
          </el-button>
          <el-button class="btn btn--primary btn--sm" :disabled="$v.$invalid" @click="apply">
            Apply
          </el-button>
        </div>
      </el-popover>

      <!-- Cancel -->
      <el-button class="btn btn--bordered !w-8 !h-8 p-2 !border !outline-none font-medium text-xs" @click="emit('remove')">
        <span class="ri-close-line block" />
      </el-button>
    </el-button-group>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits, defineProps, ref, watch,
} from 'vue';
import { FilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { filterComponentByType } from '@/shared/modules/filters/config/filterComponentByType';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: string,
  open: string;
  config: FilterConfig,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: any), (e: 'remove'), (e: 'update:open', value: string)}>();

const form = ref({});

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
