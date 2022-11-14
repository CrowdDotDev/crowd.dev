<template>
  <div class="w-full">
    <label
      class="block text-xs leading-none font-semibold mb-1"
      >Granularity</label
    >
    <el-select
      item-text="title"
      item-value="name"
      clearable
      filterable
      :model-value="
        timeDimensions[0] && timeDimensions[0].granularity
      "
      class="w-full"
      @change="(g) => handleChange(g)"
    >
      <el-option
        v-for="item in granularityOptions"
        :key="item.name"
        :value="item.name"
        @mouseleave="onSelectMouseLeave"
        >{{ item.name }}</el-option
      >
    </el-select>
  </div>
</template>

<script>
import { GRANULARITIES } from '@cubejs-client/vue3'
import { onSelectMouseLeave } from '@/utils/select'

export default {
  name: 'GranularitySelect',
  props: {
    timeDimensions: {
      type: Array,
      default: () => []
    },
    setTimeDimensions: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      granularityOptions: GRANULARITIES.filter(
        (g) =>
          !['second', 'minute', 'hour', 'quarter'].includes(
            g.name
          )
      ),
      selectedGranularity: {
        name: 'day',
        title: 'Day'
      }
    }
  },
  methods: {
    handleChange(value) {
      this.setTimeDimensions([
        {
          dimension:
            this.timeDimensions[0]['dimension']['name'],
          granularity: value !== '' ? value : undefined,
          dateRange: this.timeDimensions[0]['dateRange']
        }
      ])
    },

    onSelectMouseLeave
  }
}
</script>
