<template>
  <slot
    :connect="isHubspotEnabled ? connect : upgradePlan"
    :settings="settings"
    :has-settings="true"
    :has-integration="isHubspotEnabled"
  />
  <app-hubspot-settings-drawer v-if="openSettingsDrawer" v-model="openSettingsDrawer" />
</template>

<script setup lang="ts">
import {
  defineProps, onMounted,
  ref,
} from 'vue';
import Nango from '@nangohq/frontend';
import config from '@/config';
import AppHubspotSettingsDrawer from '@/integrations/hubspot/components/hubspot-settings-drawer.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useRouter } from 'vue-router';
import { FeatureFlag } from '@/utils/featureFlag';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const router = useRouter();

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);
const { doHubspotConnect } = mapActions('integration');

const openSettingsDrawer = ref<boolean>(false);

const isHubspotEnabled = ref(false);

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

const upgradePlan = () => {
  router.push('/settings?activeTab=plans');
};

const settings = () => {
  openSettingsDrawer.value = true;
};

onMounted(async () => {
  isHubspotEnabled.value = FeatureFlag.isFlagEnabled(
    FeatureFlag.flags.hubspot,
  );
});
</script>

<script lang="ts">
export default {
  name: 'AppHubspotConnect',
};
</script>
