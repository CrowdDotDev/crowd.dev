<template>
  <div>
    <label
      class="block text-xs leading-none font-semibold mb-1"
      >Time Dimensions</label
    >
    <el-select
      :model-value="
        timeDimensions[0] &&
        timeDimensions[0].dimension.name
      "
      clearable
      filterable
      class="w-full"
      @change="handleTimeChange"
    >
      <el-option
        v-for="item in translatedOptions(
          computedTimeDimensions
        )"
        :key="item.value"
        :value="item.value"
        :label="item.label"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
export default {
  name: 'TimeDimensionSelect',
  props: {
    measures: {
      type: Array,
      default: () => []
    },
    timeDimensions: {
      type: Array,
      default: () => []
    },
    availableTimeDimensions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['change'],
  data() {
    return {
      measureTimeDimensions: {
        'Activities.count': ['Activities.date'],
        'Members.count': [
          'Members.joinedAt',
          'Activities.date'
        ],
        'Conversations.count': ['Conversations.createdat']
      }
    }
  },
  computed: {
    computedTimeDimensions() {
      const measure = this.measures[0]
      return !measure
        ? []
        : this.availableTimeDimensions.filter((t) => {
            return this.measureTimeDimensions[
              measure.name
            ].includes(t.name)
          })
    }
  },
  methods: {
    handleTimeChange(value) {
      const [selectedTd = {}] = this.timeDimensions
      const td = this.availableTimeDimensions.find(
        ({ name }) => name === value
      )
      if (!td) {
        this.$emit('change', [])
        return
      }
      this.$emit('change', [
        {
          dimension: td.name,
          granularity: selectedTd.granularity || 'day',
          dateRange: selectedTd.dateRange
        }
      ])
    },
    translatedOptions(list) {
      return list.map((i) => {
        return {
          ...i,
          value: i.name,
          label: i18n('widget.cubejs.' + i.name)
        }
      })
    }
  }
}
</script>
