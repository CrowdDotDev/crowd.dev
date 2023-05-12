<template>
  <div>
    <el-button-group>
      <!-- Settings -->
      <el-popover
        ref="popover"
        v-model:visible="open"
        teleported
        placement="bottom-start"
        width="320"
        trigger="click"
      >
        <template #reference>
          <el-button ref="chip" class="btn btn--bordered btn--md">
            <span v-html="$sanitize(config.itemLabelRenderer(props.modelValue) || config.label)" />
          </el-button>
        </template>

        <div>
          <component :is="getComponent" v-if="getComponent" v-model="form" v-bind="props.config.options" />
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
      <el-button class="btn btn--bordered btn--md w-4" @click="emit('remove')">
        <span class="ri-close-line" />
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
  config: FilterConfig,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string), (e: 'remove')}>();

const open = ref(true);
const popover = ref();

const form = ref({});

const getComponent = computed(() => {
  const { type, component } = props.config;
  if (type === FilterConfigType.CUSTOM) {
    return component;
  }
  return filterComponentByType[props.config.type];
});

const apply = () => {
  emit('update:modelValue', form.value);
  close();
};
const close = () => {
  popover.value.hide();
};

const $v = useVuelidate();

watch(() => props.modelValue, (value) => {
  form.value = value;
}, { immediate: true, deep: true });
</script>

<script lang="ts">
export default {
  name: 'CrFilterItem',
};
</script>
