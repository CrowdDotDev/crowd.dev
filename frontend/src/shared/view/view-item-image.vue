<template>
  <el-form-item :label="label" v-if="!isBlank">
    <el-col :lg="11" :md="16" :sm="24">
      <app-image-carousel
        :value="value"
      ></app-image-carousel>
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'app-view-item-image',

  props: ['label', 'value'],

  computed: {
    isBlank() {
      return !this.value || !this.value.length
    }
  }
}
</script>

<style></style>
