<template>
  <span
    class="h-8 w-8 rounded-full flex items-center justify-center ring-2 ring-white ring-opacity"
    :style="{
      backgroundColor: getBgColor(author),
      color: getTextColor(author),
      ...(variant === 'full'
        ? colors('--tw-ring-color:textSecondary:80:1')
        : colors('--tw-ring-color:bgHighlight')),
    }"
    :class="{
      large: variant === 'large',
    }"
  >
    {{ author }}
  </span>
</template>
<script>
import { defineComponent } from "@vue/composition-api";
import makeStyles from "~~/helpers/makeStyles";

import { getBgColor, getTextColor } from "../helpers/avatarColors";
export default defineComponent({
  props: {
    activity: {
      type: Object,
      required: true,
    },
    variant: {
      type: String,
      default: "default",
    },
    styles: {
      type: Object,
      default: () => undefined
    }
  },

  computed: {
    author() {
      if (this.variant === "raw") {
        return this.activity.author;
      }
      return (
        this.activity.author.charAt(0) + this.activity.author.charAt(1)
      ).toUpperCase();
    },
  },

  methods: {
    getBgColor(author) {
      if (this.variant === "raw") {
        return this.styles.bg;
      }
      return getBgColor(author);
    },
    getTextColor(author) {
      if (this.variant === "raw") {
        return this.styles.text;
      }
      return getTextColor(author);
    },
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
  },
});
</script>
<style scoped>
.large {
  @apply md:h-10 md:w-10;
}
</style>
