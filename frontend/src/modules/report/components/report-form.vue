<template>
  <div>
    <el-form
      v-if="record"
      ref="form"
      :model="model"
      class="report-form"
    >
      <el-input
        ref="focus"
        v-model="model.name"
        class="report-form-title"
        @input="onTitleUpdate"
      />
      <ReportGridLayout
        v-model="model"
        :editable="true"
        class="-mx-4 -mt-4"
      />
    </el-form>
  </div>
</template>

<script setup>
import { defineProps, reactive } from 'vue';
import debounce from 'lodash/debounce';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import ReportGridLayout from './report-grid-layout.vue';

const props = defineProps({
  record: {
    type: Object,
    default: () => {},
  },
});

const { doUpdate } = mapActions('report');

const model = reactive(props.record);

const onTitleUpdate = debounce(async (value) => {
  model.name = value;

  await doUpdate({
    id: props.record.id,
    values: {
      ...model,
      widgets: model.widgets.map((w) => w.id),
    },
  });
}, 500);
</script>

<script>
export default {
  name: 'AppReportForm',
};
</script>

<style lang="scss">
.el-input.report-form {
  &-title {
    @apply h-16 mb-6;
    .el-input__wrapper {
      @apply rounded-none border-0 border-b border-gray-200 py-6 text-lg font-semibold bg-transparent w-full px-0 shadow-none ring-0;
      transition: all 0.2s ease;

      &:hover {
        @apply rounded-none border-0 border-b border-gray-300;
      }

      &.is-focus,
      &:focus,
      &:active {
        @apply rounded-none border-0 border-b border-gray-300 shadow-none;
        outline: unset;
      }
    }
  }
}
</style>
