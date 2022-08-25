<template>
  <a href="https://crowd.dev/#waitlist " class="text-white">
    <button
      class="rounded-lg bg-primary-900 text-white hover:bg-primary-700 h-10 px-4"
    >
      <span class="md:hidden">Claim your community</span>
      <span class="hidden md:inline-flex">{{ text }}</span>
    </button>
  </a>
</template>
<script>
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  computed: {
    text() {
      return this.$route.params.tenant
        ? `Claim ${this.$route.params.tenant}`
        : "Claim your community";
    },
  },
});
</script>
