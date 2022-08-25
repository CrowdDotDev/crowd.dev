<template>
  <div>
    <nuxt-link
      :key="conversationSlug"
      v-if="!full"
      :to="conversationLink"
      class="conversation-wrapper cursor-pointer"
      :style="colors('backgroundColor:bgHighlight')"
      @click="clickHandler"
    >
      <slot />
    </nuxt-link>
    <div
      v-else
      class="conversation-wrapper"
      :style="colors('backgroundColor:bgHighlight')"
    >
      <slot />
    </div>
  </div>
</template>
<script>
import { defineComponent } from "@vue/composition-api";
import makeStyles from "~~/helpers/makeStyles";

export default defineComponent({
  setup() {
    const isLoaded = useState("isLoaded", () => {
      return {
        conversations: false,
        mode: false,
      };
    });

    return {
      isLoaded
    }
  },
  props: {
    full: {
      type: Boolean,
      default: false,
    },
    conversationSlug: {
      type: String,
      default: "#",
    },
    tenantSlug: {
      type: String,
      default: null
    },
    tenant: {
      type: Object,
      default: () => {}
    },
    mode: {
      type: String,
      default: null
    },
    styles: {
      type: Object,
      default: () => undefined
    }
  },
  computed: {
    conversationLink() {
      if (this.mode === "subdomain") {
        return this.conversationSlug;
      } else {
        return `/${this.tenantSlug}/${this.conversationSlug}`;
      }
    },
  },

  methods: {
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
    clickHandler(e){
      this.isLoaded.conversations = false
    }
  },
});
</script>
<style scoped>
.conversation-wrapper {
  @apply block rounded-md shadow-md my-4 p-2 md:my-6 md:p-8;
}
</style>
