<template>
  <el-form-item :label="label" v-if="!isBlank">
    <el-col :lg="11" :md="16" :sm="24">
      <slot></slot>
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'app-view-item-custom',

  props: ['label', 'value'],

  computed: {
    isBlank() {
      return (
        (!this.value &&
          this.value !== 0 &&
          this.value !== false) ||
        (Array.isArray(this.value) && !this.value.length)
      )
    }
  }
}
</script>

<style></style>
