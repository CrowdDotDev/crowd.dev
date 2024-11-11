<template>
  <app-twitter-connect-drawer
    v-if="hasSettings && drawerVisible"
    v-model="drawerVisible"
    :hashtags="hashtags"
    :connect-url="connectUrl"
  />
  <slot
    :connect="isTwitterEnabled ? connect : upgradePlan"
    :settings="settings"
    :has-settings="true"
    :has-integration="isTwitterEnabled"
    :settings-component="TwitterSettings"
  />
</template>

<script setup>
import {
  defineProps, computed, ref, onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import config from '@/config';

import Message from '@/shared/message/message';
import { FeatureFlag } from '@/utils/featureFlag';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { AuthService } from '@/modules/auth/services/auth.service';
import AppTwitterConnectDrawer from '@/integrations/twitter/components/twitter-connect-drawer.vue';
import TwitterSettings from './twitter-settings.vue';

const route = useRoute();
const router = useRouter();
const isTwitterEnabled = ref(false);

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});
const drawerVisible = ref(false);

onMounted(() => {
  const isConnectionSuccessful = route.query.success;

  if (isConnectionSuccessful) {
    router.replace({ query: null });
    Message.success('Integration updated successfully');
  }
});

onMounted(async () => {
  isTwitterEnabled.value = FeatureFlag.isFlagEnabled(FeatureFlag.flags.twitter);
});

// Only render twitter drawer and settings button, if integration has settings
const hasSettings = computed(() => !!props.integration.settings);
const hashtags = computed(() => props.integration.settings?.hashtags || []);

// Create an url for the connection without the hashtags
// This will allow to be reused by the twitter drawer component
// and override the current configured hashtag
const connectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?success=true`;

  const authStore = useAuthStore();
  const { tenant } = storeToRefs(authStore);

  return `${config.backendUrl}/twitter/${
    tenant.value.id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthService.getToken()}&segments[]=${
    route.params.id
  }`;
});

const connect = () => {
  // Add the already configured hashtags to the connectUrl
  const encodedHashtags = hashtags.value.length > 0
    ? `&hashtags[]=${hashtags.value[hashtags.value.length - 1]}`
    : '';

  window.open(`${connectUrl.value}${encodedHashtags}`, '_self');
};

const upgradePlan = () => {
  router.push('/settings?activeTab=plans');
};

const settings = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppTwitterConnect',
};
</script>
