<template>
  <div class="min-h-screen flex flex-col">
    <top-header :tenant="false" :styles="styles" to="https://crowd.dev" />
    <main-section :styles="styles">
      <div class="w-full text-center mt-16">
        <h1 class="font-medium text-xl">Discover open developer communities</h1>
        <p class="my-4 max-w-md mx-auto">
          The following communities are already using crowd.dev to make their
          conversations more accessible. Claim your community today!
        </p>
        <main-cta />
      </div>
      <div class="flex flex-wrap mb-10">
        <div
          class="w-full sm:w-1/2 md:w-1/3 my-6 md:my-10"
          v-for="tenant in data"
          :key="tenant.tenantSlug"
        >
          <nuxt-link
            class="rounded-lg flex items-center justify-center h-full m-6 md:m-10 border border-transparent hover:opacity-80 hover:cursor-pointer shadow-md hover:shadow-lg"
            :style="{
              backgroundColor:
                tenant.theme && tenant.theme.bgNav && tenant.theme.bgNav !== '#140505'
                  ? tenant.theme.bgNav
                  : tenant.cardColor
                  ? tenant.cardColor
                  : getBgColor(tenant.tenantSlug),
              color: getTextColor(tenant.tenantSlug),
            }"
            target="_blank"
            :to="`/${tenant.tenantSlug}`"
          >
            <img
              v-if="tenant.logoUrl"
              :src="tenant.logoUrl"
              class="w-3/4 mr-4"
            />
            <span v-else class="font-medium text-lg">{{
              tenant.tenantName
            }}</span>
          </nuxt-link>
        </div>
      </div>
    </main-section>
  </div>
</template>

<script>
import topHeader from "~~/components/topHeader.vue";
import mainSection from "~~/components/mainSection.vue";
import { getBgColor, getTextColor } from "../helpers/avatarColors";
import makeStyles from "~~/helpers/makeStyles";
import MainCta from "~~/components/mainCta.vue";

export default defineComponent({
  async setup() {
    const styles = useState("styles");
    const isLoaded = useState("isLoaded", () => {
      return {
        conversations: false,
        mode: false,
      };
    });

    useHead({
      title: 'Discover open developer communities | crowd.dev',
      viewport: "width=device-width, initial-scale=1, maximum-scale=1",
      charset: "utf-8",
      meta: [
        {
          name: 'description',
          content: `Browse through developer communities which share their community knowledge openly.`,
        },
      ],
    });

    const { data, refresh } = await useAsyncData(`getTenants`, () =>
      $fetch("/api/getTenants")
    );

    return {
      isLoaded,
      data,
      styles,
    };
  },
  components: { topHeader, mainSection, MainCta },
  methods: {
    getBgColor,
    getTextColor,
  },
  created() {
    this.isLoaded = {
      conversations: true,
      mode: true,
    };

    if (!this.styles) {
      console.log("loading default styles");
      this.styles = {
        primary: "#e94f2e",
        secondary: "#140505",
        text: "#140505",
        textSecondary: "#7f7f7f",
        textCta: "#fff",
        bg: "#f8f8f8",
        bgHighlight: "#fff",
        bgNav: "#140505",
      };
    }
  },
});
</script>

<style scoped>
.pagination-container {
  @apply w-full;
}

.pagination-button {
  @apply relative inline-flex items-center px-4 py-2 border border-primary-500 text-sm font-medium rounded-md text-primary-500 bg-white hover:bg-primary-50 hover:cursor-pointer;
}

.inactive {
  @apply opacity-50 cursor-not-allowed hover:cursor-not-allowed;
}

.seachBar-wrapper {
  @apply w-full mx-auto relative text-gray-400 focus-within:text-gray-500;
}

.searchBar {
  @apply block w-full border-transparent pl-12 placeholder-gray-500 focus:border-transparent sm:text-sm focus:ring-primary-500 rounded-lg;
}

.searchBar-icon {
  @apply pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-4;
}

.channelFilter {
  @apply text-white hover:text-primary-500;
}

.channelFilterActive {
  @apply text-primary-900 hover:text-primary-500;
}
</style>
