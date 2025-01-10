<template>
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="true"
    :has-integration="true"
  />
  <app-hubspot-settings-drawer v-if="openSettingsDrawer" v-model="openSettingsDrawer" />
</template>

<script setup lang="ts">
import {
  defineProps,
  ref,
} from 'vue';
import Nango from '@nangohq/frontend';
import config from '@/config';
import AppHubspotSettingsDrawer from '@/integrations/hubspot/components/hubspot-settings-drawer.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);
const { doHubspotConnect } = mapActions('integration');

const openSettingsDrawer = ref<boolean>(false);

const connect = () => {
  const nango = new Nango({ host: config.nangoUrl });
  nango.auth(
    'hubspot',
    `${tenant.value.id}-hubspot`,
  )
    .then(() => doHubspotConnect(null))
    .then(() => {
      openSettingsDrawer.value = true;
    });
};

const settings = () => {
  openSettingsDrawer.value = true;
};

</script>

<script lang="ts">
export default {
  name: 'AppHubspotConnect',
};
</script>
