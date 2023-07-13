<template>
  <div class="w-full">
    <label
      for="formMeasure"
      class="block text-xs leading-none font-semibold mb-1"
    >Measure
      <span class="text-red-500 ml-0.5">*</span></label>
    <el-select
      id="formMeasure"
      clearable
      filterable
      :model-value="
        translatedOptions(measures).map((i) => i.label)
      "
      class="w-full"
      @change="onSelectChange"
    >
      <el-option
        v-for="item in translatedOptions(availableMeasures)"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :class="{
          selected: selectedMeasure.includes(item.value),
        }"
        @mouseleave="onSelectMouseLeave"
      />
    </el-select>
  </div>
</template>

<script>
import { onSelectMouseLeave } from '@/utils/select';

export default {
  name: 'MeasureSelect',
  props: {
    measures: {
      type: Array,
      default: () => [],
    },
    availableMeasures: {
      type: Array,
      default: () => [],
    },
    setMeasures: {
      type: Function,
      default: () => {},
    },
    translatedOptions: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      selectedMeasure: [],
    };
  },
  methods: {
    onSelectMouseLeave,

    onSelectChange(m) {
      this.selectedMeasure = [m];
      this.setMeasures([m]);
    },
  },
};
</script>
