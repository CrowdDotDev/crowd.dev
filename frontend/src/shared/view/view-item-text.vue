<template>
  <el-form-item v-if="!isBlank" :label="label">
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
  name: 'AppViewItemText',

  props: ['label', 'value', 'prefix'],

  computed: {
    isBlank() {
      return !this.value || this.value === 0
    }
  }
}
</script>

<style></style>
