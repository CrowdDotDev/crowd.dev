<template>
  <el-form-item v-if="!isBlank" :label="label">
    <el-col :lg="11" :md="16" :sm="24">
      <app-image-carousel
        :value="value"
      />
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'AppViewItemImage',

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
      return !this.value || !this.value.length;
    },
  },
};
</script>

<style></style>
