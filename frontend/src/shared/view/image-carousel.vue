<template>
  <el-carousel
    v-if="value && value.length"
    :arrow="value && value.length > 1 ? 'hover' : 'never'"
    :indicator-position="
      value && value.length > 1 ? 'outside' : 'none'
    "
    class="text-center"
    trigger="click"
  >
    <el-carousel-item
      v-for="(image, index) in value"
      :key="index"
    >
      <a :href="image.downloadUrl" target="_blank">
        <img
          :alt="image.name"
          :src="image.downloadUrl"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
        />
      </a>
    </el-carousel-item>
  </el-carousel>
</template>

<script>
export default {
  name: 'AppImageCarousel',

  props: {
    value: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style></style>
