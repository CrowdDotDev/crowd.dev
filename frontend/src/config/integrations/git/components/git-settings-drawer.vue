<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-git-drawer"
    title="Git"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="min-w-6 h-6 mr-2" :src="logoUrl" alt="Git logo" />
    </template>
    <template #belowTitle>
      <drawer-description integration-key="git" />
    </template>
    <template #content>
      <lf-git-settings-empty v-if="showEmptyState" @add="showEmptyState = false" />
      <div v-else class="flex flex-col gap-5 items-start">
        <lf-button
          type="primary-link"
          size="medium"
          @click="addRemote()"
        >
          + Add remote URL
        </lf-button>

        <el-form class="mt-2 w-full" @submit.prevent>
          <app-array-input
            v-for="(remote, ii) of form.remotes"
            :key="ii"
            v-model="form.remotes[ii]"
            placeholder="Enter remote URL"
            input-class="is-rounded"
            :disabled="isMirroredRepo(remote)"
          >
            <template #after>
              <lf-button
                type="secondary-link"
                size="medium"
                class="w-10 h-10"
                :disabled="isMirroredRepo(remote)"
                :class="{ 'opacity-50 cursor-not-allowed': isMirroredRepo(remote) }"
                @click="!isMirroredRepo(remote) && removeRemote(ii)"
              >
                <lf-icon name="circle-xmark" :size="20" />
              </lf-button>
            </template>
          </app-array-input>
        </el-form>

        <div v-if="mirroredRepos.length > 0" class="flex flex-col gap-3 border-t border-gray-200 pt-5">
          <div class="text-xs flex flex-col gap-1 mb-2">
            <div class="text-neutral-900 font-semibold">
              Repositories managed by a different integration
            </div>
            <div class="text-neutral-600">
              Repositories synced via GitHub, GitLab, or Gerrit, are automatically mirrored by Git integration.
            </div>
          </div>

          <div v-for="mirroredRepo of mirroredRepos" :key="mirroredRepo.url" class="text-neutral-900 text-small flex items-center gap-2">
            <lf-icon name="book" :size="16" class="text-neutral-400" />
            {{ mirroredRepo.url }}
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div
        class="flex gap-4"
        :class="{ 'justify-between': integration?.settings?.remotes?.length, 'justify-end': !integration?.settings?.remotes?.length }"
      >
        <lf-tooltip
          content="Git can’t be disconnected while it’s mirroring repositories from GitHub, GitLab, or Gerrit integrations."
          :disabled="mirroredRepos.length === 0"
          placement="top"
          class="font-primary font-semibold"
          content-class="!w-100"
        >
          <lf-button
            v-if="integration?.settings?.remotes?.length"
            type="danger-ghost"
            :disabled="mirroredRepos.length > 0"
            @click="isDisconnectIntegrationModalOpen = true"
          >
            Disconnect
          </lf-button>
        </lf-tooltip>
        <span class="flex gap-3">
          <lf-button
            v-if="!integration?.settings?.remotes?.length"
            type="outline"
            :disabled="loading"
            @click="cancel"
          >
            Cancel
          </lf-button>
          <lf-button
            v-if="hasFormChanged && props.integration"
            type="outline"
            @click="revertChanges()"
          >
            <lf-icon name="arrow-rotate-left" :size="16" />
            Revert changes
          </lf-button>
          <lf-button
            id="gitConnect"
            type="primary"
            class="!rounded-full"
            :disabled="$v.$invalid || !hasFormChanged || loading"
            :loading="loading"
            @click="connect"
          >
            <lf-icon v-if="!integration?.settings?.remotes?.length" name="link-simple" :size="16" />
            {{ integration?.settings?.remotes?.length ? 'Update' : 'Connect' }}
          </lf-button>
        </span>
      </div>
    </template>
  </app-drawer>

  <integration-confirmation-modal
    v-if="props.integration"
    v-model="isDisconnectIntegrationModalOpen"
    :platform="Platform.GIT"
    :integration-id="props.integration.id"
  />
</template>

<script setup>
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import git from '@/config/integrations/git/config';
import AppArrayInput from '@/shared/form/array-input.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import { ToastStore } from '@/shared/message/notification';
import { parseDuplicateRepoError, customRepoErrorMessage } from '@/shared/helpers/error-message.helper';
import DrawerDescription from '@/modules/admin/modules/integration/components/drawer-description.vue';
import LfGitSettingsEmpty from '@/config/integrations/git/components/git-settings-empty.vue';
import IntegrationConfirmationModal from '@/modules/admin/modules/integration/components/integration-confirmation-modal.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import AppDrawer from '@/shared/drawer/drawer.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  integration: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  segmentId: {
    type: String,
    default: null,
  },
  grandparentId: {
    type: String,
    default: null,
  },
});

const { trackEvent } = useProductTracking();

const loading = ref(false);
const form = reactive({
  remotes: [''],
});

const showEmptyState = ref(!props.integration?.settings?.remotes?.length);
const isDisconnectIntegrationModalOpen = ref(false);

// Track mirrored repos (sourceIntegrationId != gitIntegrationId)
const mirroredRepos = ref([]);
const mirroredRepoUrls = computed(() => new Set(mirroredRepos.value.map((r) => r.url)));

// Track original form state for change detection
const originalRemotes = ref([]);
const hasFormChanged = computed(() => {
  const currentSorted = [...form.remotes].filter((r) => r).sort().join(',');
  const originalSorted = [...originalRemotes.value].filter((r) => r).sort().join(',');
  return currentSorted !== originalSorted;
});

const formSnapshot = () => {
  originalRemotes.value = [...form.remotes];
};

const $v = useVuelidate({}, form, { $stopPropagation: true });

const { doGitConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const logoUrl = git.image;

// Check if a repo is mirrored (managed by another integration)
const isMirroredRepo = (url) => mirroredRepoUrls.value.has(url);

const fetchRepoMappings = () => {
  if (!props.integration?.id) return;

  IntegrationService.fetchGitMappings(props.integration)
    .then((repos) => {
      // Find repos where sourceIntegrationId != gitIntegrationId (mirrored from other platforms)
      mirroredRepos.value = repos
        .filter((r) => r.sourceIntegrationId !== r.gitIntegrationId);

      // Populate native remotes
      const nativeRepoUrls = repos.filter((r) => r.sourceIntegrationId === r.gitIntegrationId).map((r) => r.url);
      if (nativeRepoUrls.length > 0) {
        form.remotes = nativeRepoUrls;
      } else {
        form.remotes = [''];
      }
      formSnapshot();
    })
    .catch(() => {
      // Fallback to settings.remotes if API fails
      mirroredRepos.value = [];
      if (props.integration?.settings?.remotes?.length) {
        form.remotes = [...props.integration.settings.remotes];
      }
      formSnapshot();
    });
};

onMounted(() => {
  // Initially populate from settings (will be overwritten by API response)
  if (props.integration?.settings?.remotes?.length) {
    form.remotes = [...props.integration.settings.remotes];
  }
  fetchRepoMappings();
});

const addRemote = () => {
  form.remotes.push('');
};

const removeRemote = (index) => {
  form.remotes.splice(index, 1);
};

const cancel = () => {
  isVisible.value = false;
};

const connect = async () => {
  loading.value = true;

  const isUpdate = !!props.integration?.settings?.remotes?.length;

  // Send all remotes including mirrored ones to preserve them in settings
  doGitConnect({
    remotes: form.remotes,
    isUpdate,
    segmentId: props.segmentId,
    grandparentId: props.grandparentId,
    errorHandler,
  })
    .then(() => {
      trackEvent({
        key: isUpdate ? FeatureEventKey.EDIT_INTEGRATION_SETTINGS : FeatureEventKey.CONNECT_INTEGRATION,
        type: EventType.FEATURE,
        properties: {
          platform: Platform.GIT,
        },
      });

      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};

const errorHandler = (error) => {
  const errorMessage = error?.response?.data;
  const parsedError = parseDuplicateRepoError(errorMessage, 'There was an error mapping git repositories');

  if (parsedError) {
    const { repo, eId } = parsedError;
    // TODO: This is returning 404 error for some reason. It could be that the data returned by the error is incorrect.
    IntegrationService.find(eId)
      .then((integration) => {
        customRepoErrorMessage(integration.segment, repo, 'git');
      })
      .catch(() => {
        ToastStore.error(errorMessage);
      });
  }
};

const revertChanges = () => {
  form.remotes = [...originalRemotes.value];
};
</script>

<script>
export default {
  name: 'LfGitSettingsDrawer',
};
</script>
