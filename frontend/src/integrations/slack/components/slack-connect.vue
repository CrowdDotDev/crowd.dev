<template>
  <slot :connect="connect" :settings-component="SlackSettings" />
</template>

<script setup>
import { computed } from 'vue';
import config from '@/config';

import { useRoute } from 'vue-router';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { AuthService } from '@/modules/auth/services/auth.service';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import SlackSettings from './slack-settings.vue';

const { trackEvent } = useProductTracking();
const route = useRoute();

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const connectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?slack-success=true`;

  trackEvent({
    key: FeatureEventKey.CONNECT_INTEGRATION,
    type: EventType.FEATURE,
    properties: { platform: Platform.SLACK },
  });

  return `${config.backendUrl}/slack/${
    tenant.value.id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthService.getToken()}&segments[]=${route.params.id}`;
});

const connect = () => {
  window.open(connectUrl.value, '_self');
};

</script>

<script>
export default {
  name: 'AppSlackConnect',
};
</script>
