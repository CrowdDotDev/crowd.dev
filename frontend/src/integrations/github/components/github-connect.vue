<template>
  <slot :connect="connect" :has-settings="false" :settings-component="GithubSettings" />
  <lf-github-connect-modal
    v-if="isModalOpen"
    v-model="isModalOpen"
    :integration="integration"
  />
</template>

<script setup>
import { ref } from 'vue';
import LfGithubConnectModal from '@/integrations/github/components/github-connect-modal.vue';
import GithubSettings from './github-settings.vue';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isModalOpen = ref(false);

const connect = () => {
  isModalOpen.value = true;
};

</script>

<script>
export default {
  name: 'AppGithubConnect',
};
</script>
