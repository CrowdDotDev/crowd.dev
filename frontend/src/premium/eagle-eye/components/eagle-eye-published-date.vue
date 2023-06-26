<template>
  <el-form-item prop="datePublished" class="mb-0 no-margin">
    <el-radio-group
      v-model="datePublished"
      class="radio-chips together"
    >
      <el-radio-button
        v-for="date of datePublishedOptions"
        :key="date.label"
        :label="date.label"
      />
    </el-radio-group>
  </el-form-item>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue';
import datePublishedOptions from '@/premium/eagle-eye/constants/eagle-eye-date-published.json';

const emit = defineEmits(['update:datePublished']);
const props = defineProps({
  datePublished: {
    type: String,
    required: true,
  },
});

const datePublished = computed({
  get() {
    return props.datePublished;
  },
  set(v) {
    emit('update:datePublished', v);
  },
});
</script>

<style lang="scss">
.el-radio-group {
  &.radio-chips.together {
    .el-radio-button {
      @apply mr-0 mb-0;

      .el-radio-button__inner {
        @apply border-l-0 h-8 px-2 rounded-none border-gray-200 text-gray-500;
      }

      &.is-active {
        .el-radio-button__inner {
          @apply border-r border-y border-brand-500 rounded-none text-gray-900;
          box-shadow: -1px 0 0 0 rgb(233 79 46);
        }
      }

      &:first-child .el-radio-button__inner {
        @apply rounded-l-lg border-l;
      }

      &:last-child .el-radio-button__inner {
        @apply rounded-r-lg;
      }
    }
  }
}
</style>
