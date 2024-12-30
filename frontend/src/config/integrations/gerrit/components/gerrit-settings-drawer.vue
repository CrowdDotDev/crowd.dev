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
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="Gerrit logo" />
    </template>
    <template #content>
      <div class="text-gray-900 text-sm font-medium">
        Remote URL
      </div>
      <div class="text-2xs text-gray-500">
        Connect remote Gerrit repository.
      </div>

      <el-form class="mt-2" @submit.prevent>
        <el-input
          id="devUrl"
          v-model="form.orgURL"
          class="text-green-500"
          spellcheck="false"
          placeholder="Enter Organization URL"
        />
        <el-input
          id="devUrl"
          v-model="form.user"
          class="text-green-500 mt-2"
          spellcheck="false"
          placeholder="Enter username"
        />
        <el-input
          id="devUrl"
          v-model="form.key"
          class="text-green-500 mt-2"
          spellcheck="false"
          placeholder="Enter Project key"
        />
        <app-array-input
          v-for="(_, ii) of form.repoNames"
          :key="ii"
          v-model="form.repoNames[ii]"
          class="text-green-500 mt-2"
          placeholder="Enter Project Name"
        >
          <template #after>
            <el-button
              class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
              @click="removeRepoName(ii)"
            >
              <i class="ri-delete-bin-line text-lg" />
            </el-button>
          </template>
        </app-array-input>
      </el-form>
      <el-button class="btn btn-link btn-link--primary" @click="addRepoName()">
        + Add Repository Name
      </el-button>
      <br>
      <el-checkbox id="enableAllRepos" v-model="form.enableAllRepos">
        Enable All Projects
      </el-checkbox>
      <el-checkbox id="enableGit" v-model="form.enableGit">
        Enable Git Integration
      </el-checkbox>
    </template>

    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--secondary mr-4"
          :disabled="loading"
          @click="cancel"
        >
          Cancel
        </el-button>
        <el-button
          id="gerritConnect"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="connect"
        >
          <app-i18n code="common.connect" />
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import {
  computed, defineProps, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import AppArrayInput from '@/shared/form/array-input.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  integration: any,
  modelValue: boolean;
  segmentId: string | null;
  grandparentId: string | null;
}>();

const { trackEvent } = useProductTracking();

const loading = ref(false);
const form = reactive({
  orgURL: '',
  user: '',
  key: '',
  enableAllRepos: false,
  enableGit: false,
  repoNames: [],
});

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const $v = useVuelidate({}, form, { $stopPropagation: true });

const { doGerritConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const logoUrl = computed(() => CrowdIntegrations.getConfig('gerrit').image);

onMounted(() => {
  if (props.integration?.settings?.remote) {
    form.orgURL = props.integration?.settings.remote.orgURL;
    form.user = props.integration?.settings.remote.user;
    form.key = props.integration?.settings.remote.key;
    form.repoNames = props.integration?.settings.remote.repoNames;
    form.enableAllRepos = props.integration?.settings.remote.enableAllRepos;
    form.enableGit = props.integration?.settings.remote.enableGit;
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
    user: form.user,
    key: form.key,
    repoNames: form.repoNames,
    enableAllRepos: form.enableAllRepos,
    enableGit: form.enableGit,
    segmentId: props.segmentId,
    grandparentId: props.grandparentId,
  })
    .then(() => {
      trackEvent({
        key: isUpdate ? FeatureEventKey.EDIT_INTEGRATION_SETTINGS : FeatureEventKey.CONNECT_INTEGRATION,
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
</script>

<script lang="ts">
export default {
  name: 'LfGerritSettingsDrawer',
};
</script>
