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
  />
</template>

<script setup>
import { useStore } from 'vuex';
import {
  defineProps, computed, ref, onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';
import Message from '@/shared/message/message';
import AppTwitterConnectDrawer from '@/integrations/twitter/components/twitter-connect-drawer.vue';
import { FeatureFlag } from '@/utils/featureFlag';

const route = useRoute();
const router = useRouter();
const isTwitterEnabled = ref(false);

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});
const store = useStore();
const drawerVisible = ref(false);

onMounted(() => {
  const isConnectionSuccessful = route.query.success;

  if (isConnectionSuccessful) {
    router.replace({ query: null });
    Message.success('Integration updated successfuly');
  }
});

onMounted(async () => {
  isTwitterEnabled.value = FeatureFlag.isFlagEnabled(
    FeatureFlag.flags.twitter,
  );
});

// Only render twitter drawer and settings button, if integration has settings
const hasSettings = computed(() => !!props.integration.settings);
const hashtags = computed(() => props.integration.settings?.hashtags || []);

// Create an url for the connection without the hashtags
// This will allow to be reused by the twitter drawer component
// and override the current configured hashtag
const connectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?success=true`;

  return `${config.backendUrl}/twitter/${
    store.getters['auth/currentTenant'].id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}&segments[]=${route.params.id}`;
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
