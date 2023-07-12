<template>
  <slot :connect="connect" />
  <app-hacker-news-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import {
  computed,
  defineProps,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useThrottleFn } from '@vueuse/core';
import { useStore } from 'vuex';
import Nango from '@nangohq/frontend';
import config from '@/config';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

const store = useStore();

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const tenantId = computed(() => AuthCurrentTenant.get());

const callOnboard = useThrottleFn(async () => {
  await store.dispatch('integration/doHubspotConnect');
}, 2000);


const connect = async () => {
  const nango = new Nango({ host: config.nangoUrl });

  try {
    await nango.auth(
      'hubspot',
      `${tenantId.value}-hubspot`,
    );

    await callOnboard();
  } catch (e) {
    console.error(e);
  }
};

</script>

<script>
export default {
  name: 'AppHubSpotBookCall',
};
</script>
