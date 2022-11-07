<template>
  <div class="main">
    <!-- Main area -->
    <main class="min-w-0 flex-1 md:flex">
      <!-- Primary column -->
      <section
        aria-labelledby="primary-heading"
        class="min-w-0 flex-1 h-full flex flex-col md:order-last"
        :style="colors('backgroundColor:bg')"
      >
        <div class="lg:max-w-7xl w-full mx-auto px-4 md:px-8 lg:px-12">
          <slot />
        </div>
      </section>
    </main>
  </div>
</template>
<script>
import { defineComponent } from "@vue/composition-api";
import makeStyles from "~~/helpers/makeStyles";

export default defineComponent({
  props: {
    styles: {
      type: Object,
      default: undefined
    }
  },
  methods: {
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
  },
});
</script>

<style scoped>
.main {
  @apply min-h-0 flex-1 flex mt-16;
}
</style>
