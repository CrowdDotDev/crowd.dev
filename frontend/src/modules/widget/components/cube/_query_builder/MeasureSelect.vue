<template>
  <div>
    <label class="block leading-none mb-1">Measure</label>
    <el-select
      clearable
      filterable
      :model-value="
        translatedOptions(measures).map((i) => i.label)
      "
      @change="(m) => setMeasures([m])"
    >
      <el-option
        v-for="item in translatedOptions(availableMeasures)"
        :key="item.value"
        :label="item.label"
        :model-value="item.value"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
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
  }
}
</script>
