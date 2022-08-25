<template>
  <div
    style="display: flex; justify-content: space-between"
  >
    <el-input
      :value="startValue"
      @input="handleInputStart"
      style="width: 100%"
      placeholder="From"
    ></el-input>
    <span style="margin-left: 8px; margin-right: 8px"
      >-</span
    >
    <el-input
      :value="endValue"
      @input="handleInputEnd"
      style="width: 100%"
      placeholder="To"
    ></el-input>
  </div>
</template>

<script>
export default {
  name: 'app-number-range-input',

  props: ['value'],

  computed: {
    startValue() {
      return this.value && this.value.length
        ? this.value[0]
        : undefined
    },

    endValue() {
      return this.value && this.value.length > 1
        ? this.value[1]
        : undefined
    }
  },

  methods: {
    handleInputStart(value) {
      this.$emit('input', [
        Number.isNaN(value) ? Number(value) : value,
        this.endValue
      ])
    },

    handleInputEnd(value) {
      this.$emit('input', [
        this.startValue ? this.startValue : '0',
        Number.isNaN(value) ? Number(value) : value
      ])
    }
  }
}
</script>

<style></style>
