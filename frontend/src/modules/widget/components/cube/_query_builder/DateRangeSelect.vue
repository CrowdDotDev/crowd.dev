<template>
  <div class="w-full">
    <label
      for="formDateRange"
      class="block text-xs leading-none font-semibold mb-1"
    >Date Range
      <span class="text-red-500 ml-0.5">*</span></label>
    <el-select
      id="formDateRange"
      :model-value="selectedDateRange"
      filterable
      value-key="label"
      class="w-full"
      @change="changeHandler"
    >
      <el-option
        v-for="item in dateRangeItems"
        :key="item.label"
        :value="item.value"
        :label="item.label"
        @mouseleave="onSelectMouseLeave"
      />
    </el-select>
  </div>

  <div v-if="selectedDateRange === 'Custom'" class="w-full mt-2">
    <div class="custom-date-range-field">
      <el-date-picker
        v-model="selectedCustomDateRange"
        class="custom-date-picker !h-10"
        popper-class="date-picker-popper custom"
        type="daterange"
        range-separator="To"
        start-placeholder="Start date"
        end-placeholder="End date"
        value-format="YYYY-MM-DD"
        :clearable="false"
        :teleported="false"
        :disabled-date="disabledDate"
        @change="onCustomDateRangeChange"
      />
    </div>
  </div>
</template>

<script>
import { onSelectMouseLeave } from '@/utils/select';
import moment from 'moment';

export default {
  name: 'DateRangeSelect',
  props: {
    timeDimensions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['change'],
  data() {
    return {
      defaultCustomDateRange: [
        moment().utc().subtract(30, 'day').format('YYYY-MM-DD'),
        moment().utc().format('YYYY-MM-DD')],
      selectedDateRange: null,
      selectedCustomDateRange: null,
      dateRangeItems: [
        {
          value: 'Custom',
          label: 'Custom',
        },
        {
          value: 'Today',
          label: 'Today',
        },
        {
          value: 'Yesterday',
          label: 'Yesterday',
        },
        {
          value: 'This week',
          label: 'This week',
        },
        {
          value: 'This month',
          label: 'This month',
        },
        {
          value: 'This quarter',
          label: 'This quarter',
        },
        {
          value: 'This year',
          label: 'This year',
        },
        {
          value: 'Last 30 days',
          label: 'Last 30 days',
        },
        {
          value: 'Last 365 days',
          label: 'Last 12 months',
        },
        {
          value: undefined,
          label: 'All time',
        },
      ],
    };
  },
  watch: {
    timeDimensions: {
      immediate: true,
      deep: true,
      handler(newVal) {
        if (!newVal[0]) {
          this.selectedDateRange = null;
          return;
        }

        if (Array.isArray(newVal[0].dateRange)) {
          this.selectedDateRange = 'Custom';
          this.selectedCustomDateRange = newVal[0].dateRange;
          return;
        }

        const dateRange = this.dateRangeItems.find(
          (o) => o.value === newVal[0].dateRange,
        );

        this.selectedDateRange = dateRange?.label || null;
      },
    },
  },
  methods: {
    changeHandler(item) {
      let dateRange = item;
      let { granularity = 'week' } = this.timeDimensions[0];

      // Update custom range to default value
      // Update granularity default to day
      // Reset only if previous value wasn't Custom
      if (item === 'Custom' && !Array.isArray(this.timeDimensions[0].dateRange)) {
        dateRange = this.defaultCustomDateRange;
        granularity = 'day';
      }

      // Emit change to Cube
      this.$emit('change', [
        {
          dimension: this.timeDimensions[0].dimension.name,
          granularity,
          ...(dateRange ? { dateRange } : null),
        },
      ]);
    },

    // Disable dates in custom date range picker
    // Disable dates in the future and dates before 2000
    disabledDate(time) {
      if (moment(time).year() < 2000 || moment(time) > moment()) {
        return true;
      }

      return false;
    },

    // Emit change to Cube
    onCustomDateRangeChange(value) {
      this.$emit('change', [
        {
          dimension: this.timeDimensions[0].dimension.name,
          granularity: this.timeDimensions[0].granularity,
          dateRange: value,
        },
      ]);
    },

    onSelectMouseLeave,
  },
};
</script>

<style lang="scss">
.custom-date-range-field {
  .el-input__wrapper,
  .el-input__wrapper.is-focus,
  .el-input__wrapper:hover {
    @apply rounded-md w-full #{!important};

  }
}

.date-picker-popper.custom {
  .el-date-table td.today {
    & .el-date-table-cell .el-date-table-cell__text {
      @apply text-brand-500;
    }
    &.start-date .el-date-table-cell .el-date-table-cell__text,
    &.end-date .el-date-table-cell .el-date-table-cell__text {
      @apply text-white;
    }
  }

  .el-picker-panel {
    width: 552px;
  }}
</style>
