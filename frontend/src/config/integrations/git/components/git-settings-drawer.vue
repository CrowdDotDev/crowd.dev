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
          <el-tooltip
            v-for="(remote, ii) of form.remotes"
            :key="ii"
            :disabled="!isMirroredRepo(remote)"
            content="Repository is managed by another integration and mirrored to Git"
            placement="top"
          >
            <app-array-input
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
          </el-tooltip>
        </el-form>
      </div>
    </template>

    <template #footer>
      <div
        class="flex gap-4"
        :class="{ 'justify-between': integration?.settings?.remotes?.length, 'justify-end': !integration?.settings?.remotes?.length }"
      >
        <lf-button
          v-if="integration?.settings?.remotes?.length"
          type="danger-ghost"
          @click="isDisconnectIntegrationModalOpen = true"
        >
          Disconnect
        </lf-button>
        <lf-button
          v-else
          type="secondary-gray"
          size="medium"
          class="mr-4"
          :disabled="loading"
          @click="cancel"
        >
          Cancel
        </lf-button>
        <lf-button
          id="gitConnect"
          type="primary"
          size="medium"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          :loading="loading"
          @click="connect"
        >
          <lf-icon v-if="!integration?.settings?.remotes?.length" name="link-simple" :size="16" />
          {{ integration?.settings?.remotes?.length ? 'Update' : 'Connect' }}
        </lf-button>
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
const mirroredRepoUrls = ref(new Set());

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
      const mirrored = repos
        .filter((r) => r.sourceIntegrationId !== r.gitIntegrationId)
        .map((r) => r.url);
      mirroredRepoUrls.value = new Set(mirrored);

      // Populate form with all repos (both native and mirrored)
      const allRepoUrls = repos.map((r) => r.url);
      if (allRepoUrls.length > 0) {
        form.remotes = allRepoUrls;
      } else if (!props.integration?.settings?.remotes?.length) {
        form.remotes = [''];
      }
      formSnapshot();
    })
    .catch(() => {
      // Fallback to settings.remotes if API fails
      mirroredRepoUrls.value = new Set();
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
</script>

<script>
export default {
  name: 'LfGitSettingsDrawer',
};
</script>
