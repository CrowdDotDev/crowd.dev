<template>
  <app-include-toggle
    v-if="!isCustom"
    v-model="includeModel"
    :class="{ '-ml-4': searchable }"
  />
  <div class="filter-type-select">
    <div v-if="searchable" class="filter-type-select-input">
      <div
        class="input-wrapper"
        @click="searchRef.focus()"
      >
        <input
          ref="searchRef"
          v-model="query"
          :placeholder="searchPlaceholder"
        />
      </div>
    </div>
    <div
      class="filter-type-select-group filter-content-wrapper"
    >
      <div
        v-for="option of computedOptions"
        :key="option.label.key"
        class="mb-3"
      >
        <div
          class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
        >
          {{ option.label.value }}
        </div>
        <div
          v-for="nestedOption of option.nestedOptions"
          :key="nestedOption.value"
          class="filter-type-select-option group"
          :class="nestedOption.selected ? 'is-selected' : ''"
          :data-qa-value="`${option.label.key}:${nestedOption.value}`"
          data-qa="filter-select-option"
          @click="
            handleOptionClick(nestedOption, option.label)
          "
        >
          <div>
            {{ nestedOption.label }}
          </div>
          <i
            v-if="nestedOption.selected"
            class="ri-check-line text-brand-600"
          />
        </div>
      </div>
      <div
        v-if="computedOptions.length === 0 && searchable"
        class="text-gray-400 px-2 pt-2"
      >
        {{ searchEmpty }}
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  ref,
  watch,
} from 'vue';

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  value: {
    type: Object,
    default: () => {},
  },
  label: {
    type: String,
    default: '',
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  searchEmpty: {
    type: String,
    default: null,
  },
  searchPlaceholder: {
    type: String,
    default: null,
  },
  include: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:value', 'update:include']);

const query = ref('');
const searchRef = ref(null);

const model = computed({
  get() {
    return props.value;
  },
  set(v) {
    emit('update:value', v);
  },
});

const includeModel = computed({
  get() {
    return props.include;
  },
  set(v) {
    emit('update:include', v);
  },
});

const displayOptions = ref(props.options);
const computedOptions = computed(() => displayOptions.value.map(
  (o) => ({
    ...o,
    nestedOptions: o.nestedOptions.map((n) => ({
      ...n,
      selected:
              model.value?.value === n.value
              && model.value?.key === o.label.key,
    })),
  }),
));

watch(query, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    displayOptions.value = props.options.map((item) => {
      const nestedOptions = item.nestedOptions.filter(
        (option) => option.label.includes(newValue),
      );

      return {
        ...item,
        nestedOptions,
      };
    }).filter((item) => item.nestedOptions.length);
  }
});

const handleOptionClick = (option, label) => {
  model.value = {
    displayValue: option.label,
    displayKey: label.value,
    type: label.type,
    key: label.key,
    value: option.value,
  };
};
</script>

<script>
export default {
  name: 'AppFilterTypeSelectGroup',
};
</script>

<style lang="scss">
.filter-type-select {
  &-input {
    @apply border-b border-gray-200 px-2 pb-2 -ml-2 -mr-2 mb-2;
  }
  .input-wrapper {
    @apply min-h-8 bg-gray-50 shadow-none border-none rounded-md max-h-12 overflow-auto;
    .el-tag {
      margin: 4px 0 4px 4px;
    }
    input {
      &,
      &:hover,
      &:focus {
        @apply bg-gray-50 shadow-none border-none outline-none h-full px-2 min-h-8;
      }
    }
  }
  &-option.group {
    @apply justify-between;

    &.is-selected,
    &:focus.is-selected {
      i {
        @apply mr-0;
      }
    }
  }
}
</style>
