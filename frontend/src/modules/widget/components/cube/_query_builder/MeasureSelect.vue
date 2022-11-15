<template>
  <div class="w-full">
    <label
      class="block text-xs leading-none font-semibold mb-1"
      >Measure
      <span class="text-brand-500 ml-0.5">*</span></label
    >
    <el-select
      clearable
      filterable
      :model-value="
        translatedOptions(measures).map((i) => i.label)
      "
      class="w-full"
      @change="(m) => setMeasures([m])"
    >
      <el-option
        v-for="item in translatedOptions(availableMeasures)"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        @mouseleave="onSelectMouseLeave"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
import { onSelectMouseLeave } from '@/utils/select'

export default {
  name: 'MeasureSelect',
  props: {
    measures: {
      type: Array,
      default: () => []
    },
    availableMeasures: {
      type: Array,
      default: () => []
    },
    setMeasures: {
      type: Function,
      default: () => {}
    },
    translatedOptions: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    onSelectMouseLeave
  }
}
</script>
