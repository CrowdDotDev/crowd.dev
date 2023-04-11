<template>
  <slot :connect="connect" />
  <app-zapier-connect-drawer v-model="drawerVisible" />
</template>

<script setup>
import { ref } from "vue";
import AppZapierConnectDrawer from "@/integrations/zapier/components/zapier-connect-drawer.vue";

const drawerVisible = ref(false);
const connect = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: "AppZapierConnect",
};
</script>
