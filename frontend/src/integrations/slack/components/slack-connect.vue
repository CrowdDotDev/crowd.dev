<template>
  <slot :connect="connect" />
</template>

<script setup>
import { computed } from 'vue';
import config from '@/config';

import { useRoute } from 'vue-router';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

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

  return `${config.backendUrl}/slack/${
    tenant.value.id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}&segments[]=${route.params.id}`;
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
