<template>
  <ul v-if="model.length" class="lf-checkbox">
    <li v-for="option in model" :key="option.label">
      <el-checkbox
        v-model="option.selected"
        :indeterminate="option.indeterminate"
        :label="option.label"
        class="h-10"
        @change="(value) => handleParentOptionChange(value, option)"
      >
        <span class="text-gray-900 text-xs font-semibold">{{
          option.label
        }}</span>
      </el-checkbox>
      <div v-if="option.children">
        <el-checkbox-group
          v-model="option.selectedChildren"
          @change="(value) => handleChildOptionChange(value, option)"
        >
          <el-checkbox
            v-for="(childOption, index) in option.children"
            :key="index"
            :label="childOption.label"
            class="h-10 !pl-9"
          >
            <span class="text-gray-900 text-xs">{{ childOption.label }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </li>
  </ul>
  <div v-else-if="emptyText" class="h-10 px-2 flex items-center">
    <span class="text-gray-400">{{ emptyText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const emit = defineEmits(['update:options', 'onChange']);
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: null,
  },
});

const model = computed({
  get() {
    return props.options;
  },
  set(v) {
    emit('update:options', v);
    emit('onChange', v);
  },
});

const handleParentOptionChange = (parentOptionValue, parentOption) => {
  model.value = props.options.map((option) => {
    if (option.label === parentOption.label) {
      return {
        ...option,
        selected: parentOptionValue,
        selectedChildren: parentOptionValue ? option.children.map((child) => child.label) : [],
        indeterminate: false,
      };
    }

    return option;
  });
};

const handleChildOptionChange = (childOptionValue, childOption) => {
  const checkedCount = childOptionValue.length;

  model.value = props.options.map((option) => {
    if (option.label === childOption.label) {
      return {
        ...option,
        selected: checkedCount === option.children.length,
        indeterminate: checkedCount > 0 && checkedCount < option.children.length,
      };
    }

    return option;
  });
};
</script>

<script>
export default {
  name: 'AppLfCheckboxCascader',
};
</script>

<style lang="scss">
.lf-checkbox .el-checkbox {
  --el-checkbox-checked-text-color: #000000; //Black
  @apply px-2 rounded-md w-full truncate;

  &:hover {
    @apply bg-gray-50;
  }

  &__input.is-indeterminate  .el-checkbox__inner {
    @apply opacity-50;
  }

  // Label
  &__label {
    @apply pl-3 truncate h-full flex items-center;
  }

  &__input {
    // Inner component
    .el-checkbox__inner {
      @apply w-4 h-4 rounded;

      &::after {
        height: 8px;
        left: 5px;
        top: 1px;
      }
    }

    &.is-indeterminate .el-checkbox__inner::before {
      top: 6px;
    }
  }
}
</style>
