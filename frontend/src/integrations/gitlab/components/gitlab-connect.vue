<template>
  <slot
    :connect="connect"
    :has-settings="false"
    :settings-component="GitlabSettings"
  />
</template>

<script setup>
import {
  defineProps, computed, onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import config from '@/config';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { AuthService } from '@/modules/auth/services/auth.service';
import GitlabSettings from '@/integrations/gitlab/components/gitlab-settings.vue';

const route = useRoute();
const router = useRouter();

defineProps({
  integration: {
    type: Object,
    default: () => ({}),
  },
});

onMounted(() => {
  const isConnectionSuccessful = route.query.success;

  if (isConnectionSuccessful) {
    router.replace({ query: null });
    Message.success('Integration updated successfully');
  }
});

const connectUrl = computed(() => {
  const authStore = useAuthStore();
  const { tenant } = storeToRefs(authStore);

  return `${config.backendUrl}/gitlab/${
    tenant.value.id
  }/connect?crowdToken=${AuthService.getToken()}&segments[]=${route.params.id}`;
});

const connect = async () => {
  try {
    const result = await ConfirmDialog({
      type: 'notification',
      title: 'Are you the admin of your GitLab organization?',
      titleClass: 'text-lg pt-2',
      message: `Only GitLab users with admin permissions are able to connect LFX's GitLab integration.
        If you are an organization member, you will need an approval from the GitLab workspace admin. <a href="https://docs.crowd.dev/docs/github-integration" target="_blank">Read more</a>`,
      icon: 'ri-information-line',
      confirmButtonText: "I'm the GitLab organization admin",
      cancelButtonText: 'Invite organization admin to this workspace',
      verticalCancelButtonClass: 'hidden',
      verticalConfirmButtonClass: 'btn btn--md btn--primary w-full !mb-2',
      vertical: true,
      distinguishCancelAndClose: true,
      autofocus: false,
      messageClass: 'text-xs !leading-5 !mt-1 text-gray-600',
    });

    if (result) {
      window.open(connectUrl.value, '_self');
    }
  } catch (error) {
    console.error('Error connecting to GitLab:', error);
    // Handle error (e.g., show an error message to the user)
  }
};
</script>

<script>
export default {
  name: 'AppGitlabConnect',
};
</script>
