<template>
  <div class="w-full">
    <component
      :is="icon"
      class="w-full"
      aria-hidden="true"
      :style="colors(`fill:${fill}`)"
    />
  </div>
</template>

<script>
import { defineComponent } from "@vue/composition-api";
import makeStyles from "~~/helpers/makeStyles";

import {
  RiDiscordFill,
  RiGithubFill,
  RiSlackFill,
  RiOpenSourceFill,
  RiHome4Fill,
} from "vue-remix-icons";

export default defineComponent({
  components: {
    RiDiscordFill,
    RiGithubFill,
    RiSlackFill,
    RiHome4Fill
  },
  computed: {
    icon() {
      switch (this.platform) {
        case "discord":
          return RiDiscordFill;
        case "github":
          return RiGithubFill;
        case "slack":
          return RiSlackFill;
        case "website":
          return RiHome4Fill;
        default:
          return RiOpenSourceFill;
      }
    },
  },
  methods: {
    colors(picks) {
      console.log(picks);
      return makeStyles(this.styles, picks);
    },
  },
  props: {
    platform: {
      type: String,
      required: true,
    },
    fill: {
      default: "textSecondary",
    },
    styles: {
      type: Object,
      default: undefined
    }
  },
});
</script>

<style>
.default {
  @apply fill-gray-600;
}

.white {
  @apply fill-white;
}

.selected {
  @apply fill-primary-900;
}
</style>
