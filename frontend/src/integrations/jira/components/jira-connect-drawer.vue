<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-jira-drawer"
    title="Jira"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="Jira logo" />
    </template>
    <template #content>
      <div class="text-gray-900 text-sm font-medium">
        Remote URL(s)
      </div>
      <div class="text-2xs text-gray-500">
        Connect remotes for each Jira repository.
      </div>
      <el-form class="mt-2" @submit.prevent>
        <!-- <app-array-input
          v-for="(_, ii) of form.remotes"
          :key="ii"
          v-model="form.remotes[ii]"
          @blur="onBlurJiraURL(ii)"          
          placeholder="https://jira.hyperledger.org"
        >
          <template #after>
            <el-button
              class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
              @click="removeRemote(ii)"
            >
              <i class="ri-delete-bin-line text-lg" />
            </el-button>
          </template>
        </app-array-input> 
        <el-button class="btn btn-link btn-link--primary" @click="addRemote()">
          + Add remote URL
        </el-button> -->
        <app-form-item
          class="mb-6"
          :validation="$v.jiraURL"
          label="Jira URL"
          :required="true"
          :error-messages="{
            required: 'This field is required',
            url: 'Enter valid URL',
          }"
        >
          <div
            class="text-2xs text-gray-500 leading-normal mb-1"
          >
            URL of your domain in Jira.
          </div>
          <el-input
            ref="focus"
            v-model="form.jiraURL"
            placeholder="https://jira.hyperledger.org"
            @blur="onBlurJiraURL()"
          />
        </app-form-item>
        <app-form-item
          class="mb-6"
          :validation="$v.jiraUsername"
          label="Jira Username"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <div
            class="text-2xs text-gray-500 leading-normal mb-1"
          >
            Username of your domain in Jira.
          </div>
          <el-input
            ref="focus"
            v-model="form.jiraUsername"
            :disabled="!isJiraURLValid"
            placeholder="userexample@jiradomain.com"
            @blur="onBlurJiraUsername()"
          />
        </app-form-item>
        <app-form-item
          class="mb-6"
          :validation="$v.jiraUserToken"
          label="Jira User Token"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <div
            class="text-2xs text-gray-500 leading-normal mb-1"
          >
            User Token of your domain in Jira.
          </div>
          <el-input
            ref="focus"
            v-model="form.jiraUserToken"
            :disabled="!isJiraURLValid"
            placeholder="dXNlcmV4YW1wbGVAamlyYWRvbWFpbi5jb20= "
            @blur="onBlurJiraUserToken()"
          />
        </app-form-item>
        <div class="flex flex-row gap-2">
          <el-button
            v-if="isJiraURLValid"
            class="btn btn--secondary btn--md"
            :disabled="!isJiraURLValid"
            :loading="loading"
            @click="validateJiraAuthenticate()"
          >
            Verify Account
          </el-button>

          <div v-if="isJiraAuthenticateFailed" class="mt-1">
            <i class="ri-error-warning-line text-red-500 w-[14px] mr-2" />
            <span class="text-red-500 text-[13px]">Authentication failed</span>
          </div>
        </div>
        <div v-if="isJiraAuthenticateValid" class="text-2xs text-gray-500" >
          Connect projects for each Jira repository.
        </div>

        <div v-if="isJiraAuthenticateValid">
          <app-array-input
            v-for="(_, ii) of form.projects"
            :key="ii"
            v-model="form.projects[ii]"
            placeholder="10001"
            :disabled="!isJiraAuthenticateValid"
          >         
            <template #after>
              <div class="d-flex align-items-center">  
                <el-button
                  class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
                  @click="validateProject(ii)"
                >
                  <i class="ri-check-line text-lg" />
                </el-button>
                <el-button
                  class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
                  @click="removeProject(ii)"
                >
                  <i class="ri-delete-bin-line text-lg" />
                </el-button>
              </div>  
          
              <div v-if="!isProjectValid" class="mt-1">
                <i class="ri-error-warning-line text-red-500 w-[14px] mr-2" />
                <span class="text-red-500 text-[13px]">Project must be validated </span>
              </div>
              
              <div v-else class="mt-1">
                <i class="ri-checkbox-circle-fill text-green-500 w-[14px] mr-2" />
                <span class="text-green-500 text-[13px]">Project validated</span>
              </div>
            </template>    
          </app-array-input>

          <el-button class="btn btn-link btn-link--primary" :disabled="!isJiraAuthenticateValid" @click="addProject()">
            + Add project id
          </el-button>
        </div>
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
          :disabled="!isProjectValid"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="connect"
        >
          {{ integration.settings?.projects?.length ? 'Update' : 'Connect' }}
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import { required, url, helpers } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppArrayInput from '@/shared/form/array-input.vue';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { IntegrationService } from '@/modules/integration/integration-service';

const emit = defineEmits(['upd ate:modelValue']);
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
  //remotes: [''],
  jiraURL: '',
  jiraUsername: '',
  jiraUserToken: '',
  projects: [''],
});

// validateURL that url doesn't end with a slash
const validateURL = (value) => {
  if (value && value.endsWith('/')) {
    return false;
  }
  return true;
};

const rules = {
  jiraURL: {
    required,
    url,
    noSlash: helpers.withMessage('URL cannot end with a slash', validateURL),
  },
  jiraUsername: {
    required,
  },
  jiraUserToken: {
    required,
  },
};

const isValidating = ref(false);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const $externalResults = ref({});

const $v = useVuelidate(rules, form, { $externalResults,$stopPropagation: true });

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

const isJiraURLValid = ref(false);
const isJiraAuthenticateValid = ref(false);
const isJiraAuthenticateFailed = ref(false);
const isProjectValid = ref(false);


onMounted(() => {
  // if (props.integration?.settings?.remotes?.length) {
  //   form.remotes = props.integration.settings.remotes;
  // }
  if (props.integration?.settings?.jiraURL) {
    form.jiraURL = props.integration?.settings?.jiraURL;
  }
  if (props.integration?.settings?.jiraUsername) {
    form.jiraUsername = props.integration?.settings?.jiraUsername;
  }
  if (props.integration?.settings?.jiraUserToken) {
    form.jiraUserToken = props.integration?.settings?.jiraUserToken;
  }
  if (props.integration?.settings?.projects?.length) {
    form.projects = props.integration?.settings?.projects;
    isProjectValid.value=true;
  }
  isJiraURLValid.value = false;
  isJiraAuthenticateValid.value = false;
  isJiraAuthenticateFailed.value = false;
  formSnapshot();
});

// const addRemote = () => {
//   form.remotes.push('');
// };

// const removeRemote = (index) => {
//   form.remotes.splice(index, 1);
// };

const addProject = () => {
  form.projects.push('');
  isProjectValid.value = false;
};

const removeProject = (index) => {
  form.projects.splice(index, 1);
};

const cancel = () => {
  emit('update:modelValue', false);
  if (!props.integration?.settings?.jiraURL) {
    form.jiraURL = '';
    isJiraURLValid.value = false;
  } else {
    form.jiraURL = props.integration?.settings?.jiraURL; 
    isJiraURLValid.value = true;
  }
  if (!props.integration?.settings?.jiraUsername) {
    form.jiraUsername = '';
    isJiraAuthenticateValid.value = false;
    isJiraAuthenticateFailed.value = false;
  } else {
    form.jiraUsername = props.integration?.settings?.jiraUsername;
  }
  if (!props.integration?.settings?.jiraUserToken) { 
    form.jiraUserToken = '';
    isJiraAuthenticateValid.value = false;
    isJiraAuthenticateFailed.value = false;
  } else {
    form.jiraUserToken = props.integration?.settings?.jiraUserToken;
  }
  if (!props.integration?.settings?.projects?.length) {  
    form.projects = [''];
    isProjectValid.value=false;
  } else {
    form.projects = props.integration?.settings?.projects;
    isProjectValid.value=true;
  } 
  $externalResults.value = {};
  $v.value.$reset();
  formSnapshot();
};

const connect = async () => {
  loading.value = true;

  doJiraConnect({
    // remotes: form.remotes,
    jiraURL: form.jiraURL,
    jiraUsername: form.jiraUsername,
    jiraUserToken: form.jiraUserToken,
    projects: form.projects,
    isUpdate: props.integration?.settings?.jiraURL,
  })
    .then(() => {
      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
  formSnapshot();
};

// validateJiraURL method
async function validateJiraURL() {
  // check is not empty
  if (!form.jiraURL) return;

  $v.value.$clearExternalResults();
  // check if everything is valid
  if ($v.$error) return; 
  
  isValidating.value = true;

  try {
    await IntegrationService.jiraValidateURL(form.jiraURL, form.jiraUsername,form.jiraUserToken);
    isJiraURLValid.value = true;

  } catch {
    const errors = {
      jiraURL: 'Invalid jira url',
    };
    $externalResults.value = errors;
    isJiraURLValid.value = false;
  }

  isValidating.value = false;

}

// validateJiraAuthenticate method
async function validateJiraAuthenticate() {

  $v.value.$clearExternalResults();
  // check if everything is valid
  if ($v.$error) return; 
  
  isValidating.value = true;

  try {
    await IntegrationService.jiraValidateAuthenticate(form.jiraURL, form.jiraUsername,form.jiraUserToken);
    isJiraAuthenticateValid.value = true;
    isJiraAuthenticateFailed.value = false;

  } catch {
    const errors = {
      jiraUsername: 'Invalid jira username or token',
    };
    $externalResults.value = errors;
    isJiraAuthenticateFailed.value = true;
  }

  isValidating.value = false;

}

const validateProject = async (index) => {

  $v.value.$clearExternalResults();
  // check if everything is valid
  if ($v.$error) return; 
  
  isValidating.value = true;

  try {
    await IntegrationService.jiraValidateProject(form.jiraURL, form.jiraUsername,form.jiraUserToken,form.projects[index]);
    isProjectValid.value = true;

  } catch {
    const errors = {
      jiraUsername: 'Invalid jira username or token',
    };
    $externalResults.value = errors;
    isProjectValid.value = false;
  }

  isValidating.value = false;
};

const onBlurJiraURL = async () => {
  //$v.value.remotes.$touch();
  $v.value.jiraURL.$touch();
  await validateJiraURL();
};

const onBlurJiraUsername = async () => {
  isJiraAuthenticateFailed.value=false
  $v.value.jiraUsername.$touch();
};

const onBlurJiraUserToken = async () => {
  isJiraAuthenticateFailed.value=false
  $v.value.jiraUserToken.$touch();
};

</script>

<script>
export default {
  name: 'AppJiraConnectDrawer',
};
</script>

