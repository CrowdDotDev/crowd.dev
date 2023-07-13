<template>
  <div>
    <span
      class="block text-xs leading-none font-semibold mb-1"
    >Chart Type
      <span class="text-red-500 ml-0.5">*</span></span><el-radio-group
      v-model="model"
      class="radio-button-group radio-group-chart-type"
      size="large"
    >
      <el-radio-button
        v-for="item in options"
        :key="item.value"
        :label="item.value"
      >
        <div class="flex items-center text-sm">
          <i class="mr-2" :class="item.icon" />{{ item.label }}
        </div>
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
export default {
  name: 'ChartType',
  props: {
    chartType: {
      type: String,
      default: null,
    },
    updateChartType: {
      type: Function,
      default: () => {},
    },
    modelValue: {
      type: String,
      default: null,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        {
          value: 'area',
          label: 'Line',
          icon: 'ri-line-chart-line',
        },
        {
          value: 'bar',
          label: 'Bar',
          icon: 'ri-bar-chart-line',
        },
        {
          value: 'pie',
          label: 'Doughnut',
          icon: 'ri-donut-chart-line',
        },
        {
          value: 'table',
          label: 'Table',
          icon: 'ri-list-check',
        },
        {
          value: 'number',
          label: 'Number',
          icon: 'ri-hashtag',
        },
      ],
    };
  },
  computed: {
    model: {
      get() {
        return this.modelValue === 'line'
          ? 'area'
          : this.modelValue;
      },
      set(value) {
        this.updateChartType(value);
        this.$emit('update:modelValue', value);
      },
    },
  },
};
</script>
<style lang="scss">
.radio-group-chart-type {
  @apply flex flex-1;
  .el-radio-button {
    @apply flex-grow flex-shrink-0;
  }
}
</style>
