<template>
  <div class="relative">
    <div
      v-if="loading"
      class="flex items-center justify-center"
    >
      <div
        v-loading="loading"
        class="app-page-spinner w-20"
      />
    </div>
    <div v-else class="grid grid-cols-3 grid-rows-4 gap-4">
      <app-integration-list-item
        v-for="integration in integrationsArray"
        :key="integration.platform"
        :integration="integration"
      />
      <app-integration-list-item
        :integration="customIntegration"
      />
    </div>
    <app-dialog
      v-model="showGithubDialog"
      size="small"
      title="Finishing the setup"
      :show-loading-icon="true"
    >
      <template #content>
        <div class="px-6 pb-6">
          We're finishing the last steps of the
          <span class="font-semibold">GitHub</span> <br />
          integration setup, please don't reload the page.
        </div>
      </template>
    </app-dialog>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  defineProps, computed, onMounted, ref,
} from 'vue';

import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppIntegrationListItem from '@/modules/integration/components/integration-list-item.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const store = useStore();
const props = defineProps({
  onboard: {
    type: Boolean,
    default: false,
  },
});

const integrationCount = computed(() => store.state.integration.count);
const isSegmentIdDifferent = computed(() => store.state.segmentId !== route.params.id);

const customIntegration = ref({
  platform: 'custom',
  name: 'Build your own',
  description:
    'Use our integration framework to build your own connector.',
  image: '/images/integrations/custom.svg',
});

const loading = computed(
  () => store.getters['integration/loadingFetch'],
);

const integrationsArray = computed(() => (props.onboard
  ? CrowdIntegrations.mappedEnabledConfigs(store)
  : CrowdIntegrations.mappedConfigs(store)));

const showGithubDialog = ref(false);

onMounted(async () => {
  if (integrationCount.value === 0 || isSegmentIdDifferent.value) {
    await store.dispatch('integration/doFetch');
  }

  const params = new URLSearchParams(window.location.search);
  // GitHub redirects back here. This might have to be changed.
  // It is giving us a code for Oauth and and Install ID in the URL,
  // we need those things to authenticate the app and to perform the Oauth
  const code = params.get('code');
  const installId = params.get('installation_id');

  // If the URL parameters are present (we have been redirected from GitHub):
  // do the authentication and the Oauth.
  const setupAction = params.get('setup_action');

  // Get the source. If none we use GitHub.
  const source = params.get('source');

  if (code) {
    if (source === 'discord') {
      await store.dispatch('integration/doDiscordConnect', {
        guildId: params.get('guild_id'),
      });
    } else {
      showGithubDialog.value = true;
      await store.dispatch('integration/doGithubConnect', {
        code,
        installId,
        setupAction,
      });
      showGithubDialog.value = false;
    }
  }
});
</script>

<script>
export default {
  name: 'AppIntegrationsList',
};
</script>
