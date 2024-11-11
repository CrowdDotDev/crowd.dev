<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-jira-drawer"
    title="Jira"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="Jira logo" />
    </template>
    <template #content>
      <div class="w-full flex flex-col mb-6">
        <p class="text-[16px] font-semibold">
          Authentication
        </p>
        <div class="text-2xs text-gray-500 leading-normal mb-1">
          Connect a Jira endpoint. Provide a valid token if this jira endpoint
          requires it. (optional)
        </div>
      </div>

      <el-form label-position="top" class="form" @submit.prevent>
        <app-form-item
          class="mb-6"
          :validation="$v.jiraURL"
          label="Jira URL"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <el-input v-model="form.jiraURL" @blur="onBlurJiraURL()" />
        </app-form-item>
      </el-form>
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
          id="jiraConnect"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="connect"
        >
          {{ integration.settings?.url ? "Update" : "Connect" }}
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';

import { required } from '@vuelidate/validators';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppFormItem from '@/shared/form/form-item.vue';
// import elementChangeDetector from '@/shared/form/element-change';

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
});

const loading = ref(false);
const form = reactive({
  jiraURL: '',
  apiToken: '',
  username: '',
  personalAccessToken: '',
  projects: [],
});

const rules = {
  jiraURL: {
    required,
  },
};

const isVerificationEnabled = ref(false);
const isAPIConnectionValid = ref(false);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const $v = useVuelidate(rules, form, { $stopPropagation: true });

const { doJiraConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const logoUrl = computed(() => CrowdIntegrations.getConfig('jira').image);

onMounted(() => {
  if (props.integration?.settings?.url) {
    form.jiraURL = props.integration.settings.url;
    form.personalAccessToken = props.integration.settings.auth.personalAccessToken;
    form.username = props.integration.settings.auth.username;
    form.apiToken = props.integration.settings.auth.apiToken;
    form.projects = props.integration?.settings?.projects;
    isAPIConnectionValid.value = true;
  }
  formSnapshot();
});

const cancel = () => {
  isVisible.value = false;
};

const onBlurJiraURL = () => {
  $v.value.jiraURL.$touch();
  canVerify();
};

const canVerify = async () => {
  const isCorrect = await $v.value.$validate();
  if (isCorrect) {
    isVerificationEnabled.value = true;
  } else {
    isVerificationEnabled.value = false;
  }
};

const connect = async () => {
  loading.value = true;

  doJiraConnect({
    url: form.jiraURL,
    username: form.username,
    personalAccessToken: form.personalAccessToken,
    apiToken: form.apiToken,
    projects: form.projects,
    isUpdate: props.integration?.settings,
  })
    .then(() => {
      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<script>
export default {
  name: 'AppJiraConnectDrawer',
};
</script>
