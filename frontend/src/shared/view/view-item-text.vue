<template>
  <el-form-item :label="label" v-if="!isBlank">
    <el-col :lg="11" :md="16" :sm="24">
      <strong v-if="prefix"
        >{{ prefix }} {{ value }}</strong
      >
      <strong v-if="!prefix">{{ value }}</strong>
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'app-view-item-text',

  props: ['label', 'value', 'prefix'],

  computed: {
    isBlank() {
      return !this.value || this.value === 0
    }
  }
}
</script>

<style></style>
