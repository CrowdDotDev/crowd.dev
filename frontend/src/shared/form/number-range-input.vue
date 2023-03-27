<template>
  <el-form
    class="form flex items-center justify-between -mb-4 pt-2"
  >
    <el-form-item label="From" class="w-1/2 px-2">
      <el-input
        v-model="startValue"
        placeholder="0"
      />
    </el-form-item>
    <el-form-item label="To" class="w-1/2 px-2">
      <el-input
        v-model="endValue"
        placeholder="100"
      />
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'AppNumberRangeInput',

  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],

  computed: {
    startValue: {
      get() {
        return this.modelValue && this.modelValue.length
          ? this.modelValue[0]
          : undefined;
      },
      set(value) {
        this.$emit('update:modelValue', [
          Number.isNaN(value) ? Number(value) : value,
          this.endValue,
        ]);
      },
    },

    endValue: {
      get() {
        return this.modelValue && this.modelValue.length > 1
          ? this.modelValue[1]
          : undefined;
      },
      set(value) {
        this.$emit('update:modelValue', [
          this.startValue ? this.startValue : '0',
          Number.isNaN(value) ? Number(value) : value,
        ]);
      },
    },
  },
};
</script>

<style></style>
