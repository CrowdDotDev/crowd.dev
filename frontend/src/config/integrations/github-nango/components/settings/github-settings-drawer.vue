<template>
  <app-drawer
    v-model="isDrawerVisible"
    title="GitHub"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
  >
    <template #beforeTitle>
      <img
        :src="githubImage"
        class="min-w-6 h-6 mr-2"
        alt="GitHub logo"
      />
    </template>
    <template #afterTitle>
      <lf-github-version-tag version="v2" tooltip-content="New integration" class="ml-2" />
    </template>
    <template #belowTitle>
      <drawer-description integration-key="github" />
    </template>
    <template #content>
      <div class="flex-grow overflow-auto">
        <lf-github-settings-empty
          v-if="repositories.length === 0"
          @add="isAddRepositoryModalOpen = true"
        />
        <div v-else>
          <lf-github-settings-mapping
            v-model:repositories="repositories"
            v-model:organizations="organizations"
            v-model:mappings="repoMappings"
            :subprojects="subprojects"
            @add="isAddRepositoryModalOpen = true"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div
        class="flex gap-4"
        :class="{ 'justify-between': props.integration, 'justify-end': !props.integration }"
      >
        <lf-button
          v-if="props.integration"
          type="danger-ghost"
          @click="isDisconnectIntegrationModalOpen = true"
        >
          Disconnect
        </lf-button>
        <span class="flex gap-3">
          <lf-button
            v-if="!props.integration"
            type="outline"
            @click="isDrawerVisible = false"
          >
            Cancel
          </lf-button>
          <lf-button
            v-if="hasChanges && props.integration"
            type="outline"
            @click="revertChanges()"
          >
            <lf-icon name="arrow-rotate-left" :size="16" />
            Revert changes
          </lf-button>

          <lf-button
            type="primary"
            class="!rounded-full"
            :disabled="
              $v.$invalid
                || !repositories.length
            "
            @click="connect()"
          >
            <lf-icon v-if="!props.integration" name="link-simple" :size="16" />
            {{ props.integration ? 'Update' : 'Connect' }}
          </lf-button>
        </span>
      </div>
    </template>
    <!-- </div> -->
  </app-drawer>
  <lf-github-settings-add-repository-modal
    v-if="isAddRepositoryModalOpen"
    v-model="isAddRepositoryModalOpen"
    v-model:organizations="organizations"
    v-model:repositories="repositories"
    :integration="props.integration"
  />
  <integration-confirmation-modal
    v-if="props.integration"
    v-model="isDisconnectIntegrationModalOpen"
    :platform="Platform.GITHUB"
    :integration-id="props.integration.id"
  />
</template>

<script lang="ts" setup>
import {
  computed, onMounted, ref, watch,
} from 'vue';
import isEqual from 'lodash/isEqual';
import useVuelidate from '@vuelidate/core';
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
import AppDrawer from '@/shared/drawer/drawer.vue';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { showIntegrationProgressNotification } from '@/modules/integration/helpers/integration-progress-notification';
import { dateHelper } from '@/shared/date-helper/date-helper';
import { parseDuplicateRepoError, customRepoErrorMessage } from '@/shared/helpers/error-message.helper';
import LfGithubVersionTag from '@/config/integrations/github/components/github-version-tag.vue';
import IntegrationConfirmationModal from '@/modules/admin/modules/integration/components/integration-confirmation-modal.vue';
import DrawerDescription from '@/modules/admin/modules/integration/components/drawer-description.vue';

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
const initialRepositories = ref<GitHubSettingsRepository[]>([]);
const initialOrganizations = ref<GitHubOrganization[]>([]);
const initialRepoMappings = ref<Record<string, string>>({});
const isDisconnectIntegrationModalOpen = ref(false);

const hasChanges = computed(() => repositories.value.length !== initialRepositories.value.length
    || !isEqual(repoMappings.value, initialRepoMappings.value));

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

const revertChanges = () => {
  repositories.value = [...initialRepositories.value];
  organizations.value = [...initialOrganizations.value];
  repoMappings.value = { ...initialRepoMappings.value };
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

      initialRepositories.value = [...repositories.value];
      initialOrganizations.value = [...organizations.value];
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
