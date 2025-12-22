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
    <template #content>
      <div class="text-gray-900 text-sm font-medium">
        Remote URL(s)
      </div>
      <div class="text-2xs text-gray-500">
        Connect remotes for each Git repository.
      </div>

      <el-form class="mt-2" @submit.prevent>
        <app-array-input
          v-for="(_, ii) of form.remotes"
          :key="ii"
          v-model="form.remotes[ii]"
          placeholder="https://github.com/CrowdDotDev/crowd.dev.git"
        >
          <template #after>
            <lf-button
              type="primary-link"
              size="medium"
              class="w-10 h-10"
              @click="removeRemote(ii)"
            >
              <lf-icon name="trash-can" :size="20" />
            </lf-button>
          </template>
        </app-array-input>
      </el-form>

      <lf-button
        type="primary-link"
        size="medium"
        @click="addRemote()"
      >
        + Add remote URL
      </lf-button>
    </template>

    <template #footer>
      <div>
        <lf-button
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
          {{ integration?.settings?.remotes?.length ? 'Update' : 'Connect' }}
        </lf-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import git from '@/config/integrations/git/config';
import AppArrayInput from '@/shared/form/array-input.vue';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import { ToastStore } from '@/shared/message/notification';
import { parseDuplicateRepoError, customRepoErrorMessage } from '@/shared/helpers/error-message.helper';

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

const loading = ref(false);
const form = reactive({
  remotes: [''],
});

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
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

onMounted(() => {
  if (props.integration?.settings?.remotes?.length) {
    form.remotes = props.integration.settings.remotes;
  }
  formSnapshot();
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
