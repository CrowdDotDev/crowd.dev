<template>
  <slot :connect="connect" :settings="settings" :has-settings="true" />
  <app-hubspot-settings-drawer v-model="openSettingsDrawer" />
</template>

<script setup lang="ts">
import {
  defineProps,
  ref,
} from 'vue';
import Nango from '@nangohq/frontend';
import config from '@/config';
import AppHubspotSettingsDrawer from '@/integrations/hubspot/components/hubspot-settings-drawer.vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant } = mapGetters('auth');
const { doHubspotConnect } = mapActions('integration');

const openSettingsDrawer = ref<boolean>(false);

const connect = () => {
  const nango = new Nango({ host: config.nangoUrl });
  nango.auth(
    'hubspot',
    `${currentTenant.value.id}-hubspot`,
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
