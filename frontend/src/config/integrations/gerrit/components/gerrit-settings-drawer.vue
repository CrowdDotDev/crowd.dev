<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-gerrit-drawer"
    title="Gerrit"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="min-w-6 h-6 mr-2" :src="logoUrl" alt="Gerrit logo" />
    </template>
    <template #belowTitle>
      <drawer-description integration-key="gerrit" />
    </template>
    <template #content>
      <lf-gerrit-settings-empty v-if="showEmptyState" @add="showEmptyState = false" />
      <div v-else class="flex flex-col gap-5 items-start">
        <div class="flex justify-between w-full">
          <lf-button
            type="primary-link"
            size="medium"
            @click="addRepoName()"
          >
            + Add Repository Name
          </lf-button>
          <lf-switch
            v-model="form.enableAllRepos"
            :size="'small'"
          >
            <template #default>
              <span class="text-gray-900 text-small mr-2 underline decoration-dotted decoration-gray-400">Enable All Projects</span>
            </template>
          </lf-switch>
        </div>

        <el-form class="mt-2 w-full" @submit.prevent>
          <el-input
            id="devUrl"
            v-model="form.orgURL"
            class="text-green-500"
            spellcheck="false"
            placeholder="Enter Organization URL"
          />
          <!-- <el-input
            id="devUrl"
            v-model="form.user"
            class="text-green-500 mt-2"
            spellcheck="false"
            placeholder="Enter username"
          />
          <el-input
            id="devUrl"
            v-model="form.pass"
            class="text-green-500 mt-2"
            spellcheck="false"
            placeholder="Enter user HTTP password"
          /> -->
          <app-array-input
            v-for="(_, ii) of form.repoNames"
            :key="ii"
            v-model="form.repoNames[ii]"
            class="text-green-500 mt-2"
            placeholder="Enter Project Name"
          >
            <template #after>
              <lf-button
                type="secondary-link"
                size="medium"
                class="w-10 h-10"
                @click="removeRepoName(ii)"
              >
                <lf-icon name="circle-xmark" :size="20" />
              </lf-button>
            </template>
          </app-array-input>
        </el-form>
      </div>
    </template>

    <template #footer>
      <div>
        <lf-button
          type="outline"
          class="mr-4"
          :disabled="loading"
          @click="cancel"
        >
          Cancel
        </lf-button>
        <lf-button
          id="gerritConnect"
          type="primary"
          class="!rounded-full"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          :loading="loading"
          @click="connect"
        >
          Connect
        </lf-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import gerrit from '@/config/integrations/gerrit/config';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import AppArrayInput from '@/shared/form/array-input.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfSwitch from '@/ui-kit/switch/Switch.vue';
import { parseDuplicateRepoError, customRepoErrorMessage } from '@/shared/helpers/error-message.helper';
import { IntegrationService } from '@/modules/integration/integration-service';
import { ToastStore } from '@/shared/message/notification';
import DrawerDescription from '@/modules/admin/modules/integration/components/drawer-description.vue';
import LfGerritSettingsEmpty from '@/config/integrations/gerrit/components/gerrit-settings-empty.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  integration: any;
  modelValue: boolean;
  segmentId: string | null;
  grandparentId: string | null;
}>();

const { trackEvent } = useProductTracking();

const loading = ref(false);
const form = reactive({
  orgURL: '',
  // user: '',
  // pass: '',
  enableAllRepos: false,
  enableGit: true,
  repoNames: [],
});

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const $v = useVuelidate({
  orgURL: { required },
  repoNames: {
    required: (value: string[]) => value.length > 0 && value.every((v) => v.trim() !== ''),
  },
}, form, { $stopPropagation: true });

const { doGerritConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const logoUrl = gerrit.image;
const showEmptyState = ref(!props.integration?.settings?.remote?.orgURL);

onMounted(() => {
  if (props.integration?.settings?.remote) {
    form.orgURL = props.integration?.settings.remote.orgURL;
    // form.user = props.integration?.settings.remote.user;
    // form.pass = props.integration?.settings.remote.pass;
    form.repoNames = props.integration?.settings.remote.repoNames;
    form.enableAllRepos = props.integration?.settings.remote.enableAllRepos;
  }
  formSnapshot();
});

const addRepoName = () => {
  form.repoNames.push('');
};

const removeRepoName = (index) => {
  form.repoNames.splice(index, 1);
};

const cancel = () => {
  isVisible.value = false;
};

const connect = async () => {
  loading.value = true;

  const isUpdate = !!props.integration?.settings;

  doGerritConnect({
    orgURL: form.orgURL,
    // user: form.user,
    // pass: form.pass,
    repoNames: form.repoNames,
    enableAllRepos: form.enableAllRepos,
    enableGit: form.enableGit,
    segmentId: props.segmentId,
    grandparentId: props.grandparentId,
    errorHandler,
  })
    .then(() => {
      trackEvent({
        key: isUpdate
          ? FeatureEventKey.EDIT_INTEGRATION_SETTINGS
          : FeatureEventKey.CONNECT_INTEGRATION,
        type: EventType.FEATURE,
        properties: {
          platform: Platform.GERRIT,
        },
      });

      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};

const errorHandler = (error: any) => {
  const errorMessage = error?.response?.data;
  const parsedError = parseDuplicateRepoError(errorMessage, 'There was an error mapping gerrit repositories');

  if (parsedError) {
    const { repo, eId } = parsedError;
    // TODO: This is returning 404 error for some reason. It could be that the data returned by the error is incorrect.
    IntegrationService.find(eId)
      .then((integration) => {
        customRepoErrorMessage(integration.segment, repo, 'gerrit');
      })
      .catch(() => {
        ToastStore.error(errorMessage);
      });
  }
};
</script>

<script lang="ts">
export default {
  name: 'LfGerritSettingsDrawer',
};
</script>
