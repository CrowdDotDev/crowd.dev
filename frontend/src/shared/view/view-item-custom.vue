<template>
  <el-form-item v-if="!isBlank" :label="label">
    <el-col :lg="11" :md="16" :sm="24">
      <slot />
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'AppViewItemCustom',

  props: {
    label: {
      type: String,
      default: null,
    },
    value: {
      type: String,
      default: null,
    },
  },

  computed: {
    isBlank() {
      return (
        (!this.value
          && this.value !== 0
          && this.value !== false)
        || (Array.isArray(this.value) && !this.value.length)
      );
    },
  },
};
</script>

<style></style>
