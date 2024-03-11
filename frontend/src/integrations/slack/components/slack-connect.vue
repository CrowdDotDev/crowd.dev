<template>
  <slot :connect="connect" />
</template>

<script setup>
import { useStore } from 'vuex';
import { defineProps, computed } from 'vue';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';
import { useRoute } from 'vue-router';

const store = useStore();
const route = useRoute();

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const connectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?slack-success=true`;

  return `${config.backendUrl}/slack/${
    store.getters['auth/currentTenant'].id
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
