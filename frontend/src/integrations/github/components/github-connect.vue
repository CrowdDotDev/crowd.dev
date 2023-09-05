<template>
  <slot :connect="connect" />
</template>

<script setup>
import { computed } from 'vue';
import config from '@/config';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { useRouter } from 'vue-router';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const router = useRouter();

// We have 3 GitHub apps: test, test-local and prod
// Getting the proper URL from config file
const githubConnectUrl = computed(() => config.gitHubInstallationUrl);
const connect = () => {
  ConfirmDialog({
    type: 'notification',
    title:
      'Are you the admin of your GitHub organization?',
    titleClass: 'text-lg pt-2',
    message:
      `Only GitHub users with admin permissions are able to connect crowd.dev's GitHub integration.
      If you are an organization member, you will need an approval from the GitHub workspace admin. <a href="https://docs.crowd.dev/docs/github-integration" target="_blank">Read more</a>`,
    icon: 'ri-information-line',
    confirmButtonText: 'I\'m the GitHub organization admin',
    cancelButtonText: 'Invite organization admin to this workspace',
    verticalCancelButtonClass: 'btn btn--md btn--primary w-full',
    verticalConfirmButtonClass: 'btn btn--md btn--bordered w-full !mb-2',
    vertical: true,
    distinguishCancelAndClose: true,
    autofocus: false,
    messageClass: 'text-xs !leading-5 !mt-1 text-gray-600',
  }).then(() => {
    window.open(githubConnectUrl.value, '_self');
  }).catch((action) => {
    if (action === 'cancel') {
      router.push({
        name: 'settings',
      });
    }
  });
};

</script>

<script>
export default {
  name: 'AppGithubConnect',
};
</script>
