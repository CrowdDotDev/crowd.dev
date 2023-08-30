<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="groups.io"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="handleCancel()"
  >
    <template #beforeTitle>
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="Groups.io logo" />
    </template>
    <template #content>
      <div class="w-full flex flex-col mb-6">
        <p class="text-[16px] font-semibold">
          Authentication
        </p>
        <div class="text-2xs text-gray-500 leading-normal mb-1">
          Connect a Groups.io account. You must be a group owner to authenticate.
        </div>
      </div>
      <el-form label-position="top" class="form">
        <app-form-item
          v-if="!isAPIConnectionValid"
          class="
          mb-6"
          :validation="$v.email"
          label="Email"
          :required="true"
          :error-messages="{
            required: 'This field is required',
            url: 'Enter valid email',
          }"
        >
          <!-- <div class="text-2xs text-gray-500 leading-normal mb-1">
            Hostname of your community instance in Discourse.
          </div> -->
          <el-input ref="focus" v-model="form.email" type="email" @blur="onBlurEmail()" />
        </app-form-item>
        <app-form-item
          v-if="!isAPIConnectionValid"
          class="mb-6"
          :validation="$v.apiKey"
          label="Password"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <el-input ref="focus" v-model="form.password" @blur="onBlurPassword()">
            <template #suffix>
              <div
                v-if="isValidating"
                v-loading="isValidating"
                class="flex items-center justify-center w-6 h-6"
              />
            </template>
          </el-input>
        </app-form-item>
        <app-form-item
          v-if="!isAPIConnectionValid"
          class="mb-6"
          :validation="$v.twoFactorCode"
          label="2FA Code (optional)"
        >
          <el-input ref="focus" v-model="form.twoFactorCode" @blur="onBlurTwoFactorCode()">
            <template #suffix>
              <div
                v-if="isValidating"
                v-loading="isValidating"
                class="flex items-center justify-center w-6 h-6"
              />
            </template>
          </el-input>
        </app-form-item>

        <div class="flex flex-row gap-2">
          <el-button
            v-if="!isAPIConnectionValid"
            class="btn"
            :disabled="!isVerificationEnabled"
            :loading="isVerifyingAccount"
            @click="validateAccount()"
          >
            Verify Account
          </el-button>

          <el-button v-if="isAPIConnectionValid" class="btn" @click="reverifyAccount()">
            Reverify Account
          </el-button>

          <div v-if="accountVerificationFailed" class="mt-1">
            <i class="ri-error-warning-line text-red-500 w-[14px] mr-2" />
            <span class="text-red-500 text-[13px]">Authentication failed</span>
          </div>
        </div>
      </el-form>
      <el-divider />
      <div class="w-full flex flex-col mb-6" :class="isAPIConnectionValid ? 'opacity-100' : 'opacity-50'">
        <p class="text-[16px] font-semibold">
          Connect groups
        </p>
        <div class="text-2xs text-gray-500 leading-normal mb-1">
          Select which groups you want to track. All topics avaliable in each group will be monitored. <a
            href="https://docs.crowd.dev/docs/discourse-integration#webhooks"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline"
          >Read more</a>
        </div>
      </div>
      <el-form
        class="flex flex-col"
        label-position="top"
        :class="isAPIConnectionValid ? 'opacity-100' : 'opacity-50'"
        @submit.prevent
      >
        <div v-if="isAPIConnectionValid">
          <app-array-input
            v-for="(_, ii) of form.groups"
            :key="ii"
            v-model="form.groups[ii]"
            placeholder="crowd-test"
            :validation-function="validateGroup"
          >
            <template #after>
              <el-button
                class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
                :disabled="!isAPIConnectionValid"
                @click="removeGroup(ii)"
              >
                <i class="ri-delete-bin-line text-lg" />
              </el-button>
            </template>
          </app-array-input>

          <el-button class="btn btn-link btn-link--primary" :disabled="!isAPIConnectionValid" @click="addGroup()">
            + Add group name
          </el-button>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div style="flex: auto">
        <el-button class="btn btn--md btn--secondary mr-3" :disabled="loading" @click="handleCancel">
          Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :disabled="cantConnect"
          :loading="loading"
          @click="connect()"
        >
          {{ integration.settings?.email ? "Update" : "Connect" }}
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  ref, reactive, onMounted, computed,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import {
  required, email,
} from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppDrawer from '@/shared/drawer/drawer.vue';
import {
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import AppFormItem from '@/shared/form/form-item.vue';
import formChangeDetector from '@/shared/form/form-change';
// import elementChangeDetector from '@/shared/form/element-change';
import { IntegrationService } from '@/modules/integration/integration-service';
import AppArrayInput from './groupsio-array-input.vue';

const { doGroupsioConnect } = mapActions('integration');

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

const form = reactive({
  email: '',
  password: '',
  twoFactorCode: '',
  groups: [''],
  groupsValidationState: [null],
});

const isValidating = ref(false);
const isVerificationEnabled = ref(false);
const isVerifyingAccount = ref(false);
const isAPIConnectionValid = ref(false);
const accountVerificationFailed = ref(false);
const cookie = ref('');
const loading = ref(false);

const cantConnect = computed(() => {
  if (props.integration?.settings?.email) {
    return !hasFormChanged.value || loading.value || !isAPIConnectionValid.value;
  }
  return $v.value.$invalid
      || !hasFormChanged.value || loading.value || !isAPIConnectionValid.value;
});

const rules = {
  email: {
    required,
    email,
  },
  password: {
    required,
  },
};

const addGroup = () => {
  form.groups.push('');
};

const removeGroup = (index) => {
  form.groups.splice(index, 1);
};

const $v = useVuelidate(rules, form);

const validateAccount = async () => {
  isVerifyingAccount.value = true;
  accountVerificationFailed.value = false;
  try {
    const response = await IntegrationService.groupsioGetToken(form.email, form.password, form.twoFactorCode);
    const { groupsioCookie } = response;
    cookie.value = groupsioCookie;
    isAPIConnectionValid.value = true;
  } catch (e) {
    isAPIConnectionValid.value = false;
    accountVerificationFailed.value = true;
  }
  isVerifyingAccount.value = false;
};

const reverifyAccount = () => {
  isAPIConnectionValid.value = false;
};

const validateGroup = async (groupName) => {
  try {
    await IntegrationService.groupsioVerifyGroup(groupName, cookie.value);
    return true;
  } catch (e) {
    return false;
  }
};

const onBlurEmail = () => {
  $v.value.email.$touch();
  canVerify();
};

const onBlurPassword = () => {
  $v.value.password.$touch();
  canVerify();
};

const onBlurTwoFactorCode = () => {
  $v.value.twoFactorCode.$touch();
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

const emit = defineEmits(['update:modelValue']);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const logoUrl = CrowdIntegrations.getConfig('groupsio').image;

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});

const handleCancel = () => {
  emit('update:modelValue', false);
  if (!props.integration?.settings?.email) {
    form.email = '';
    form.password = '';
    form.twoFactorCode = '';
    form.groups = [''];
    form.groupsValidationState = new Array(form.groups.length).fill(true);
    cookie.value = '';
    isAPIConnectionValid.value = false;
    isVerifyingAccount.value = false;
    accountVerificationFailed.value = false;
    $v.value.$reset();
  } else {
    form.email = props.integration?.settings?.email;
    form.password = '';
    form.twoFactorCode = '';
    // eslint-disable-next-line no-unsafe-optional-chaining
    form.groups = props?.integration?.settings?.groups ? [...props.integration?.settings?.groups] : [''];
    form.groupsValidationState = new Array(form.groups.length).fill(true);
    cookie.value = props.integration?.settings?.token;
    isAPIConnectionValid.value = true;
    isVerifyingAccount.value = false;
    accountVerificationFailed.value = false;
    $v.value.$reset();
  }
  formSnapshot();
};

onMounted(() => {
  if (props.integration?.settings?.email) {
    form.email = props?.integration?.settings?.email;
    form.groups = props?.integration?.settings?.groups;
    form.groupsValidationState = new Array(form.groups.length).fill(true);
    cookie.value = props?.integration?.settings?.token;
    isAPIConnectionValid.value = true;
  }
  formSnapshot();
});

const connect = async () => {
  loading.value = true;

  doGroupsioConnect({
    email: form.email,
    token: cookie.value,
    groupNames: form.groups,
    isUpdate: !!props.integration.settings?.email,
  })
    .then(() => {
      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });

  formSnapshot();
};

</script>

<script>
export default {
  name: 'AppDiscourseConnectDrawer',
};
</script>
