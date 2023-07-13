<template>
  <div
    class="banner"
    :class="variant ? `banner--${variant}` : ''"
  >
    <div class="flex items-center grow">
      <div v-if="spinner" class="banner-spinner">
        <div
          v-loading="true"
          class="app-page-spinner"
        />
      </div>
      <slot>This is an alert</slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AlertBar',
  props: {
    variant: {
      type: String,
      default: null,
    },
    spinner: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss">
.banner {
  @apply absolute h-14 inset-x-0 bg-gray-600 top-0 z-10 flex items-center px-6 text-white border-b;

  &--alert {
    @apply border-yellow-100 bg-yellow-50 text-black;
  }

  &--info {
    @apply border-blue-100 bg-blue-100 text-black;
  }

  &-icon {
    @apply h-6 w-6 mr-1 bg-gray-800 rounded flex justify-center items-center;
  }

  &-spinner {
    @apply h-6 w-6 mr-2 relative;

    .app-page-spinner {
      @apply m-0;
    }
    .el-loading-spinner {
      @apply h-6 flex items-center justify-center top-0 mt-0;
      .circular {
        @apply h-4 w-4;
      }
    }
    .el-loading-spinner .path {
      stroke: #fff;
    }
  }
}
</style>
