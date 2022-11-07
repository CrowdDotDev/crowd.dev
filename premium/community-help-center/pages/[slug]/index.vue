<script setup>
import Loading from "~~/components/loading.vue";

const route = useRoute();

const styles = useState("styles", () => false);
const { data, refresh } = await useAsyncData(`getTenantSlugIndexSlug`, () =>
  $fetch("/api/getTenantSlug", {
    params: {
      slug: route.params.slug,
    },
    headers: useRequestHeaders(["host"]),
  })
);
</script>

<template>
  <div v-if="data">
    <loading :styles="data.styles" />
    <div>
      <div v-if="data.mode === 'subdomain'">
        <conversation-detail
          :conversationSlug="route.params.slug"
          :tenant-slug="data.tenantSlug"
          :tenant="data.tenant"
          :mode="data.mode"
          :styles="data.styles"
        />
      </div>
      <div v-if="data.mode === 'urlPath'">
        <tenant-page
          :tenant-slug="data.tenantSlug"
          :tenant="data.tenant"
          :mode="data.mode"
          :styles="data.styles"
        />
      </div>
    </div>
    <!-- TODO: Redirect -->
    <div v-if="data.tenant === undefined">
      <claim />
    </div>
  </div>
</template>

<script>
import ConversationDetail from "~~/components/conversationDetail.vue";
import tenantPage from "~~/components/tenantPage.vue";
export default {
  components: {
    tenantPage,
    ConversationDetail,
  },
  created() {
    if (this.data && this.data.styles && !this.styles) {
      this.styles = this.data.styles;
    }
  },
};
</script>

<style></style>
