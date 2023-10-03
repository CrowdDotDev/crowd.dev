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
    <div v-else class="flex flex-col gap-6">
      <div
        v-for="highlightedIntegration in highlightedIntegrationsArray"
        :key="highlightedIntegration.platform"
        class="panel"
      >
        <app-onboard-integration-item
          :integration="highlightedIntegration"
          @allow-redirect="onConnect"
          @invite-colleagues="emit('inviteColleagues')"
        />
      </div>
      <div class="panel !p-0">
        <app-onboard-integration-item
          v-for="integration in integrationsArray"
          :key="integration.platform"
          :integration="integration"
          @allow-redirect="onConnect"
        />
      </div>
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
  computed, onMounted, ref,
} from 'vue';

import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppOnboardIntegrationItem from '@/modules/onboard/components/onboard-integration-item.vue';

const emit = defineEmits(['allowRedirect', 'inviteColleagues']);

const store = useStore();

const loading = computed(
  () => store.getters['integration/loadingFetch'],
);
const integrationsArray = computed(() => CrowdIntegrations.mappedConfigs(store)
  .filter((i) => !i.onboard?.highlight && !(i.scale || i.premium || i.hideAsIntegration)));
const highlightedIntegrationsArray = computed(() => CrowdIntegrations.mappedConfigs(store)
  .filter((i) => i.onboard?.highlight && !(i.scale || i.premium)));
const showGithubDialog = ref(false);

onMounted(async () => {
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

const onConnect = (val) => {
  emit('allowRedirect', val);
};
</script>
