<template>
  <div>
    <div class="px-4 pt-3">
      <el-select
        v-model="form"
        multiple
        filterable
        remote
        :reserve-keyword="false"
        placeholder="Select options"
        :remote-method="searchOptions"
        :teleported="false"
        class="filter-multiselect"
        popper-class="filter-multiselect-popper"
        :loading="loading"
        @change="selected"
      >
        <el-option
          v-for="option of selectedOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
          class="!hidden"
        />
        <template v-for="(group, gi) of filteredOptions" :key="gi">
          <div
            v-if="group.label && group.options.length > 0"
            class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
          >
            {{ group.label }}
          </div>
          <el-option
            v-for="option of group.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <el-checkbox
              :model-value="form.includes(option.value)"
              class="filter-checkbox h-4"
            />
            {{ option.label }}
          </el-option>
        </template>
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  MultiSelectFilterOptions,
  MultiSelectFilterConfig, MultiSelectFilterOptionGroup,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

const props = defineProps<{
  modelValue: string[],
  data: any,
  config: MultiSelectFilterConfig
} & MultiSelectFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: string[]): void, (e: 'update:data', value:any): void}>();

const loading = ref(false);

const form = computed<string[]>({
  get: () => props.modelValue,
  set: (value: string[]) => emit('update:modelValue', value),
});

const selectedOptions = ref([]);

const filteredOptions = ref<MultiSelectFilterOptionGroup[]>(props.options);

const searchOptions = (query: string) => {
  loading.value = true;
  if (props.remote && props.remoteMethod) {
    props.remoteMethod(query)
      .then((options) => {
        filteredOptions.value = [
          {
            options,
          },
        ];
      })
      .finally(() => {
        loading.value = false;
      });
  } else {
    filteredOptions.value = props.options.map((g) => ({
      ...g,
      options: g.options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    }));

    loading.value = false;
  }
};

const populate = () => {
  if (!props.remotePopulateItems) {
    return;
  }
  props.remotePopulateItems(props.modelValue)
    .then((options) => {
      selectedOptions.value = options;
    });
};

const selected = (any) => {
  console.log(any);
};

onMounted(() => {
  searchOptions('');
  if (props.remote && props.modelValue.length > 0) {
    populate();
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrMultiSelectTagsFilter',
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
