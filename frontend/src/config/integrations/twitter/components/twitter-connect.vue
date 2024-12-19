<template>
  <div class="flex items-center gap-4">
    <!--    <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--      <lf-icon name="circle-info" type="regular" />-->
    <!--      Details-->
    <!--    </lf-button>-->
    <lf-button type="secondary" @click="connect()">
      <lf-icon name="link-simple" />
      <slot>Connect</slot>
    </lf-button>
  </div>
</template>

<script setup>
import {
  defineProps, computed, onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import config from '@/config';

import Message from '@/shared/message/message';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { AuthService } from '@/modules/auth/services/auth.service';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

// Only render twitter drawer and settings button, if integration has settings
const hashtags = computed(() => props.integration?.settings?.hashtags || []);

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

const finallizeTwitterConnection = () => {
  const isConnectionSuccessful = route.query.success;
  const twitterError = route.query['twitter-error'];

  if (isConnectionSuccessful) {
    router.replace({ query: null });
    Message.success('Integration updated successfully');
  }

  if (twitterError) {
    Message.error('Something went wrong during X/Twitter OAuth. Please try again later.');
  }
};

onMounted(() => {
  finallizeTwitterConnection();
});
</script>

<script>
export default {
  name: 'LfTwitterConnect',
};
</script>
