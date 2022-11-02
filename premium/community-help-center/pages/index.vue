<script setup>
import Loading from "~~/components/loading.vue";
const route = useRoute();
/**
 * We either render the landing page, or tenant page here
 * If the domain is open.crowd.dev => Render landing page
 * If the domain is something else => Render tenant page
 */
const styles = useState("styles", () => false);
const { data, refresh } = await useAsyncData(`getTenantSlug`, () =>
  $fetch("/api/getTenantSlug", {
    headers: useRequestHeaders(["host"]),
  })
);
</script>
<template>
  <div v-if="data">
    <loading :styles="data.styles" />
    <div v-if="data.mode">
      <div v-if="data.mode === 'subdomain'">
        <tenant-page
          :tenant-slug="data.tenantSlug"
          :tenant="data.tenant"
          :mode="data.mode"
          :styles="data.styles"
        />
      </div>
      <div v-else>
        <claim />
      </div>
    </div>
  </div>
</template>
<script>
import tenantPage from "~~/components/tenantPage.vue";
import claim from "~~/components/claim.vue";

export default {
  components: {
    tenantPage,
    claim,
  },
  created() {
    if (this.data && this.data.styles && !this.styles) {
      this.styles = this.data.styles;
    }
  },
};
</script>
