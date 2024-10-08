<template>
  <div class="relative">
    <div v-if="loading" class="flex items-center justify-center">
      <div v-loading="loading" class="app-page-spinner w-20" />
    </div>
    <app-integration-progress-wrapper v-else :segments="[props.segment]">
      <template #default="{ progress, progressError }">
        <div class="flex flex-wrap -mx-2.5">
          <article
            v-for="integration in integrationsArray"
            :key="integration.platform"
            class="px-2.5 w-full sm:1/2 lg:w-1/3 pb-5"
          >
            <app-integration-list-item
              class="h-full"
              :integration="integration"
              :progress="progress"
              :progress-error="progressError"
            />
          </article>
        </div>
      </template>
    </app-integration-progress-wrapper>

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
    <app-dialog
      v-model="showGitlabDialog"
      size="small"
      title="Finishing the setup"
      :show-loading-icon="true"
    >
      <template #content>
        <div class="px-6 pb-6">
          We're finishing the last steps of the
          <span class="font-semibold">GitLab</span> <br />
          integration setup, please don't reload the page.
        </div>
      </template>
    </app-dialog>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, onMounted, ref } from 'vue';

import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppIntegrationListItem from '@/modules/integration/components/integration-list-item.vue';
import { useRoute } from 'vue-router';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';

const { trackEvent } = useProductTracking();
const route = useRoute();
const store = useStore();
const props = defineProps({
  onboard: {
    type: Boolean,
    default: false,
  },
  segment: {
    type: String,
    required: true,
  },
});

const integrationCount = computed(() => store.state.integration.count);
const isSegmentIdDifferent = computed(
  () => store.state.segmentId !== route.params.id,
);

const loading = computed(() => store.getters['integration/loadingFetch']);

const integrationsArray = computed(() => (props.onboard
  ? CrowdIntegrations.mappedEnabledConfigs(store)
  : CrowdIntegrations.mappedConfigs(store)));

const showGithubDialog = ref(false);
const showGitlabDialog = ref(false);

onMounted(async () => {
  localStorage.setItem('segmentId', route.params.id);
  localStorage.setItem('segmentGrandparentId', route.params.grandparentId);

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

      trackEvent({
        key: FeatureEventKey.CONNECT_INTEGRATION,
        type: EventType.FEATURE,
        properties: { platform: Platform.DISCORD },
      });
    } else if (source === 'gitlab') {
      showGitlabDialog.value = true;
      await store.dispatch('integration/doGitlabConnect', {
        code,
        state: params.get('state'),
      });
      showGitlabDialog.value = false;
    } else {
      const state = params.get('state');

      if (state === 'noconnect') {
        return;
      }

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
