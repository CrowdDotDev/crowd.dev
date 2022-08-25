<script setup>
const route = useRoute();

let isLoaded = useState("isLoaded", () => {
  return {
    conversations: false,
    mode: true,
  };
});

const styles = useState("styles", () => false);
const { data, refresh } = await useAsyncData(`getTenantSlug`, () =>
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
    <div v-if="data.tenant">
      <conversation-detail
        :conversationSlug="route.params.conversation"
        :tenant-slug="data.tenantSlug"
        :tenant="data.tenant"
        :mode="data.mode"
        :styles="data.styles"
      />
    </div>
  </div>
</template>

<script>
import ConversationDetail from "~~/components/conversationDetail.vue";
export default {
  components: {
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
