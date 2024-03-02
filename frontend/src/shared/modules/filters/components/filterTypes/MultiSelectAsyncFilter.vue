<template>
  <div v-if="props.modelValue">
    <cr-filter-include-switch
      v-if="!props.hideIncludeSwitch"
      v-model="include"
    />
    <div class="px-4 pt-3">
      <el-select
        v-model="data.selected"
        multiple
        remote
        filterable
        :reserve-keyword="false"
        placeholder="Select options"
        :remote-method="searchOptions"
        :teleported="false"
        class="filter-multiselect"
        popper-class="filter-multiselect-popper"
        :loading="loading"
        no-data-text=""
      >
        <el-option
          v-for="option of filteredOptions"
          :key="option.value"
          :label="option.label"
          :value="option"
        >
          <div
            v-if="config.id !== 'tags'"
            class="h-4 el-checkbox filter-checkbox"
            :class="{ 'is-checked': props.modelValue.value.includes(option.value) }"
          >
            <span class="el-checkbox__input" :class="{ 'is-checked': form.value.includes(option.value) }">
              <span class="el-checkbox__inner" />
            </span>
          </div>
          <template v-if="config.id === 'organizations'">
            <span class="flex items-center justify-center w-6 h-6 p-1 mr-3 border rounded-md ">
              <img v-if="option.logo" :src="option.logo" class="w-4 h-4 min-w-[16px]" :alt="option.label" />
              <i v-else class="flex items-center justify-center w-4 h-4 text-gray-300 ri-community-line" />
            </span>
          </template>
          {{ option.label }}
        </el-option>
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOption,
  MultiSelectAsyncFilterOptions,
  MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

const props = defineProps<{
  modelValue: MultiSelectAsyncFilterValue,
  data: any,
  config: MultiSelectAsyncFilterConfig
} & MultiSelectAsyncFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: MultiSelectAsyncFilterValue): void, (e: 'update:data', value: any): void}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: MultiSelectFilterValue) => emit('update:modelValue', value),
});

const data = computed({
  get: () => props.data,
  set: (value: any) => emit('update:data', value),
});

const defaultForm: MultiSelectAsyncFilterValue = {
  value: [],
  include: true,
};

const rules: any = {
  value: {
    required,
  },
};

useVuelidate(rules, form);

const include = computed<boolean>({
  get() {
    return props.modelValue.include;
  },
  set(value: boolean) {
    emit('update:modelValue', {
      ...props.modelValue,
      include: value,
    });
  },
});

watch(() => props.modelValue.value, (value?: string[]) => {
  if (value?.length !== data.value.selected?.length) {
    props.remotePopulateItems(value || [])
      .then((options) => {
        data.value.selected = options;
      });
  }
}, { immediate: true });

watch(() => data.value.selected, (value, oldValue) => {
  if (props.config.id === 'tags') {
    filteredOptions.value = filteredOptions.value.filter((option) => !value.map((v: any) => v.value).includes(option.value));

    const removedOption: any = oldValue?.find((option: any) => !value.includes(option));

    if (removedOption && !filteredOptions.value.some((option) => option.value === removedOption.value)) {
      const position = oldValue.findIndex((option: any) => option.value === removedOption.value);

      if (position >= 0) {
        filteredOptions.value.splice(position, 0, {
          label: removedOption.label,
          value: removedOption.value,
        });
      }
    }
  }

  emit('update:modelValue', {
    ...props.modelValue,
    value: value.map((v) => v.value),
  });
});

const loading = ref<boolean>(false);
const filteredOptions = ref<MultiSelectAsyncFilterOption[]>([]);

const searchOptions = (query: string) => {
  loading.value = true;
  props.remoteMethod(query)
    .then((options) => {
      if (props.config.id === 'tags') {
        const mappedOptions = options.map((option) => ({
          label: option.label,
          value: option.value,
        }));
        filteredOptions.value = mappedOptions;
      } else {
        filteredOptions.value = options;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  searchOptions('');
  emit('update:modelValue', {
    ...defaultForm,
    ...form.value,
  });
  if (!data.value.selected) {
    data.value.selected = [];
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrMultiSelectAsyncFilter',
};
</script>

<style lang="scss">
.filter-multiselect {
  @apply w-full relative;

  .el-select__tags{
    @apply top-1.5 transform-none;
  }

  .el-select-dropdown__item {
    @apply px-3 #{!important};

    &.selected{
      @apply bg-brand-25 font-normal px-3 #{!important};
    }

    &:after{
      @apply hidden;
    }
  }
  .el-input__wrapper,
  .el-input__wrapper.is-focus,
  .el-input__wrapper:hover {
    @apply bg-gray-50 shadow-none rounded-md border border-gray-50 transition #{!important};

    input {
      &,
      &:hover,
      &:focus {
        border: none !important;
        @apply bg-gray-50 shadow-none outline-none h-full min-h-8;
      }
    }
  }

  .el-tag{
    @apply bg-white #{!important};
  }
}
.filter-multiselect-popper {
  @apply relative inset-0 block shadow-none h-auto opacity-100 transform-none #{!important};

  .el-select-dropdown{
    @apply -mx-4 p-0 mt-3 border-t border-gray-100;

    .el-scrollbar__view{
      @apply py-3 px-3;
    }
  }
}
</style>
