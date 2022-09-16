<template>
  <div>
    <label class="block leading-none mb-1"
      >Date Range</label
    >
    <el-select
      :model-value="
        timeDimensions[0] &&
        dateRangeItems.find(
          (o) => o.value === timeDimensions[0].dateRange
        ).label
      "
      filterable
      value-key="label"
      @change="changeHandler"
    >
      <el-option
        v-for="item in dateRangeItems"
        :key="item.label"
        :model-value="item.value"
        :label="item.label"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: 'DateRangeSelect',
  props: {
    timeDimensions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['change'],
  data() {
    return {
      dateRangeItems: [
        {
          value: 'Today',
          label: 'Today'
        },
        {
          value: 'Yesterday',
          label: 'Yesterday'
        },
        {
          value: 'This week',
          label: 'This week'
        },
        {
          value: 'This month',
          label: 'This month'
        },
        {
          value: 'This quarter',
          label: 'This quarter'
        },
        {
          value: 'This year',
          label: 'This year'
        },
        {
          value: 'Last 30 days',
          label: 'Last 30 days'
        },
        {
          value: 'Last year',
          label: 'Last year'
        },
        {
          value: undefined,
          label: 'All time'
        }
      ]
    }
  },
  methods: {
    changeHandler(item) {
      this.$emit('change', [
        {
          dimension: this.timeDimensions[0].dimension.name,
          granularity: this.timeDimensions[0].granularity,
          ...(item ? { dateRange: item } : null)
        }
      ])
    }
  }
}
</script>
