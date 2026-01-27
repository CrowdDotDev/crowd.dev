<template>
  <lf-drawer v-model="isDrawerVisible">
    <div class="flex flex-col justify-between h-full">
      <section class="pt-4 px-6 pb-6 border-b border-gray-100">
        <div class="flex justify-between pb-3">
          <div>
            <p class="text-tiny text-gray-500 mb-1.5">
              Integration
            </p>
            <div class="flex items-center gap-2">
              <img :src="githubImage" alt="GitHub" class="h-6 min-w-6" />
              <h5 class="text-black">
                GitHub
              </h5>
            </div>
          </div>
          <lf-button
            type="secondary-ghost"
            icon-only
            @click="isDrawerVisible = false"
          >
            <lf-icon name="xmark" />
          </lf-button>
        </div>
        <p class="text-small text-gray-500">
          Sync GitHub repositories to track profile information and all relevant
          activities like commits, pull requests, discussions, and more.
        </p>
      </section>
      <div class="flex-grow overflow-auto">
        <lf-github-settings-empty
          v-if="repositories.length === 0"
          @add="isAddRepositoryModalOpen = true"
        />
        <div v-else class="px-6 pt-5">
          <lf-github-settings-mapping
            v-model:repositories="repositories"
            v-model:organizations="organizations"
            v-model:mappings="repoMappings"
            :subprojects="subprojects"
            @add="isAddRepositoryModalOpen = true"
          />
        </div>
      </div>
      <div
        class="border-t border-gray-100 py-5 px-6 flex justify-end gap-4"
        style="box-shadow: 0 -4px 4px 0 rgba(0, 0, 0, 0.05)"
      >
        <lf-button
          type="secondary-ghost-light"
          @click="isDrawerVisible = false"
        >
          Cancel
        </lf-button>
        <span>
          <lf-button
            type="primary"
            :disabled="
              $v.$invalid
                || !repositories.length
            "
            @click="connect()"
          >
            {{ props.integration ? 'Update settings' : 'Connect' }}
          </lf-button>
        </span>
      </div>
    </div>
  </lf-drawer>
  <lf-github-settings-add-repository-modal
    v-if="isAddRepositoryModalOpen"
    v-model="isAddRepositoryModalOpen"
    v-model:organizations="organizations"
    v-model:repositories="repositories"
    :integration="props.integration"
  />
</template>

<script lang="ts" setup>
import {
  computed, onMounted, ref, watch,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import LfDrawer from '@/ui-kit/drawer/Drawer.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGithubSettingsEmpty from '@/config/integrations/github-nango/components/settings/github-settings-empty.vue';
import LfGithubSettingsAddRepositoryModal from '@/config/integrations/github-nango/components/settings/github-settings-add-repository-modal.vue';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import { Integration } from '@/modules/admin/modules/integration/types/Integration';
import {
  GitHubOrganization,
  GitHubSettings,
  GitHubSettingsOrganization,
  GitHubSettingsRepository,
} from '@/config/integrations/github-nango/types/GithubSettings';
import LfGithubSettingsMapping from '@/config/integrations/github-nango/components/settings/github-settings-mapping.vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import { ToastStore } from '@/shared/message/notification';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { showIntegrationProgressNotification } from '@/modules/integration/helpers/integration-progress-notification';
import { dateHelper } from '@/shared/date-helper/date-helper';
import { parseDuplicateRepoError, customRepoErrorMessage } from '@/shared/helpers/error-message.helper';

const props = defineProps<{
  modelValue: boolean;
  integration?: Integration<GitHubSettings>;
  segmentId: string | null;
  grandparentId: string | null;
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const { doFetch } = mapActions('integration');
const { trackEvent } = useProductTracking();

const isAddRepositoryModalOpen = ref(false);

const subprojects = ref([]);
const organizations = ref<GitHubOrganization[]>([]);
const repositories = ref<GitHubSettingsRepository[]>([]);
const repoMappings = ref<Record<string, string>>({});
const initialRepoMappings = ref<Record<string, string>>({});

// Drawer visibility
const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const fetchSubProjects = () => {
  // OSS projects have thousands of subprojects which crash the app
  const EXTERNAL_OSS_SEGMENT_ID = '0fc01c53-8a6a-47db-b0cd-53de0ee65190';

  if (props.grandparentId === EXTERNAL_OSS_SEGMENT_ID && props.segmentId) {
    // Only fetch current subproject, avoiding thousands of others
    LfService.findSegment(props.segmentId).then((currentSubproject) => {
      subprojects.value = [currentSubproject];
    });
  } else {
    LfService.findSegment(props.grandparentId).then((segment) => {
      subprojects.value = segment.projects.map((p) => p.subprojects).flat().filter((s) => s !== undefined);
    });
  }
};

const $v = useVuelidate();

const allOrganizations = computed<any[]>(() => {
  const owners = new Set();
  return repositories.value.reduce((acc: any[], r) => {
    if (!owners.has(r.org!.name)) {
      owners.add(r.org!.name);
      acc.push(r.org!);
    }
    return acc;
  }, []);
});

const buildSettings = (): GitHubSettings => {
  const orgs = allOrganizations.value.map(
    (o: GitHubOrganization): GitHubSettingsOrganization => ({
      ...o,
      fullSync: organizations.value.some((org) => org.url === o.url),
      updatedAt: o.updatedAt || dateHelper().toISOString(),
      repos: repositories.value
        .filter((r) => r.org!.url === o.url)
        .map((r) => ({
          name: r.name,
          url: r.url,
          forkedFrom: r.forkedFrom,
          updatedAt:
            props.integration
            && repoMappings.value[r.url] !== initialRepoMappings.value[r.url]
              ? dateHelper().toISOString()
              : r.updatedAt || dateHelper().toISOString(),
        })),
    }),
  );
  return { orgs, updateMemberAttributes: true };
};

const connect = () => {
  const settings: GitHubSettings = buildSettings();

  IntegrationService.githubNangoConnect(
    settings,
    [props.segmentId],
    repoMappings.value,
    props.integration?.id,
  )
    .then((integration) => {
      doFetch([integration.segmentId]);

      trackEvent({
        key: FeatureEventKey.CONNECT_INTEGRATION,
        type: EventType.FEATURE,
        properties: {
          integration: Platform.GITHUB,
        },
      });

      if (integration.status === 'in-progress') {
        showIntegrationProgressNotification('github', integration.segmentId);
      } else {
        ToastStore.success(
          props.integration?.id
            ? 'Settings have been updated'
            : 'GitHub has been connected successfully',
        );
      }

      isDrawerVisible.value = false;
    })
    .catch((error) => {
      errorHandler(error);
    });
};

const errorHandler = (error: any) => {
  const errorMessage = error?.response?.data;
  const parsedError = parseDuplicateRepoError(errorMessage, props.integration?.id
    ? 'There was error updating settings'
    : 'There was error connecting GitHub');

  if (parsedError) {
    const { repo, eId } = parsedError;
    // TODO: This is returning 404 error for some reason. It could be that the data returned by the error is incorrect.
    IntegrationService.find(eId)
      .then((integration) => {
        customRepoErrorMessage(integration.segment, repo, 'github');
      })
      .catch(() => {
        ToastStore.error(errorMessage);
      });
  }
};

const fetchGithubMappings = () => {
  if (!props.integration) return;
  IntegrationService.fetchGitHubMappings(props.integration).then(
    (res: any[]) => {
      const mappings = res.reduce(
        (rm, mapping) => ({
          ...rm,
          [mapping.url]: mapping.segment.id,
        }),
        {},
      );
      // Create new objects to ensure no reference sharing
      repoMappings.value = { ...mappings };
      initialRepoMappings.value = { ...mappings };
    },
  );
};

watch(
  () => props.integration,
  (value?: Integration<GitHubSettings>) => {
    if (value) {
      fetchGithubMappings();
      const { orgs } = value.settings;
      organizations.value = orgs
        .filter((o) => o.fullSync)
        .map((o) => ({
          name: o.name,
          logo: o.logo,
          url: o.url,
          updatedAt: o.updatedAt,
        }));
      repositories.value = orgs.reduce(
        (acc: GitHubSettingsRepository[], o) => [
          ...acc,
          ...o.repos.map((r) => ({
            ...r,
            org: {
              name: o.name,
              logo: o.logo,
              url: o.url,
              updatedAt: o.updatedAt,
            },
          })),
        ],
        [],
      );
    }
  },
  { immediate: true },
);

onMounted(() => {
  fetchSubProjects();
});

const githubImage = new URL(
  '@/assets/images/integrations/github.png',
  import.meta.url,
).href;
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsDrawer',
};
</script>
