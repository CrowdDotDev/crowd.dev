<template>
  <span v-html="message" />
</template>

<script>
import { i18n } from '@/i18n';

export default {
  name: 'AppI18n',

  props: {
    code: {
      type: String,
      default: null,
    },
    args: {
      type: Array,
      default: () => [],
    },
    fallback: {
      type: String,
      default: undefined,
    },
  },

  computed: {
    message() {
      const translated = i18n(
        this.code,
        ...(this.args || []),
      );
      return this.fallback !== undefined
        && translated === this.code
        ? i18n(this.fallback)
        : translated;
    },
  },
};
</script>

<style></style>
