<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="Discourse"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="handleCancel()"
  >
    <template #beforeTitle>
      <img
        class="w-6 h-6 mr-2"
        :src="logoUrl"
        alt="Discourse logo"
      />
    </template>
    <template #content>
      <el-form
        label-position="top"
        class="form"
      >
        <app-form-item
          class="mb-6"
          :validation="$v.discourseURL"
          label="Discourse URL"
          :required="true"
          :error-messages="{
            required: 'This field is required',
            url: 'Enter valid URL',
          }"
        >
          <div
            class="text-2xs text-gray-500 leading-normal mb-1"
          >
            Hostname of your community instance in Discourse.
          </div>
          <el-input
            ref="focus"
            v-model="form.discourseURL"
            placeholder="https://community.crowd.dev"
            @blur="onBlurDiscourseURL()"
          />
        </app-form-item>
        <app-form-item
          class="mb-6"
          :validation="$v.apiKey"
          label="API Key"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <div
            class="text-2xs text-gray-500 leading-normal mb-1"
          >
            Create a new API key in your Discourse account's settings page. You must be an admin user to connect your acount. <a href="https://docs.crowd.dev/docs/discourse-integration#api-key" target="_blank" rel="noopener noreferrer">Read more</a>
          </div>
          <el-input
            ref="focus"
            v-model="form.apiKey"
            @blur="onBlurAPIKey()"
          >
            <template #suffix>
              <div
                v-if="isValidating"
                v-loading="isValidating"
                class="flex items-center justify-center w-6 h-6"
              />
            </template>
          </el-input>
        </app-form-item>
      </el-form>
      <el-divider />
      <div class="w-full flex flex-col mb-6" :class="isAPIConnectionValid ? 'opacity-100' : 'opacity-50'">
        <p class="text-[16px] font-semibold">
          Connect webhooks
        </p>
        <div
          class="text-2xs text-gray-500 leading-normal mb-1"
        >
          Create new webhooks in your Discourse account's settings page with the following credentials. <a href="https://docs.crowd.dev/docs/discourse-integration#webhooks" target="_blank" rel="noopener noreferrer">Read more</a>
        </div>
      </div>
      <el-form
        class="flex flex-col"
        label-position="top"
        :class="isAPIConnectionValid ? 'opacity-100' : 'opacity-50'"
      >
        <app-form-item label="Payload URL">
          <el-input :value="payloadURL" :readonly="true" :disabled="!isAPIConnectionValid">
            <template #append>
              <el-tooltip
                content="Copy to clipboard"
                placement="top"
              >
                <el-button
                  class="append-icon"
                  :disabled="!isAPIConnectionValid"
                  @click="copyToClipboard('url')"
                >
                  <i class="ri-file-copy-line" />
                </el-button>
              </el-tooltip>
            </template>
          </el-input>
        </app-form-item>
        <app-form-item label="Webhook Secret">
          <el-input
            ref="inputRef"
            :value="webhookSecret"
            readonly
            :disabled="!isAPIConnectionValid"
            :type="showToken ? 'text' : 'password'"
          >
            <template #append>
              <el-tooltip
                v-if="!showToken"
                content="Show Webhook Secret"
                placement="top"
              >
                <el-button
                  class="append-icon"
                  :disabled="!isAPIConnectionValid"
                  @click="onShowToken"
                >
                  <i class="ri-eye-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-else
                content="Copy to clipboard"
                placement="top"
              >
                <el-button :disabled="!isAPIConnectionValid" @click="copyToClipboard('secret')">
                  <i class="ri-file-copy-line" />
                </el-button>
              </el-tooltip>
            </template>
          </el-input>
        </app-form-item>
      </el-form>
      <el-card v-if="isAPIConnectionValid && props.integration?.settings?.forumHostname" shadow="never" class="rounded-[6px]">
        <div class="mb-3 flex flex-row w-full justify-between">
          <el-button :disabled="isWebhookVerifying" class="btn btn--bordered" @click="verifyWebhook()">
            Verify config
          </el-button>
          <div v-if="isWebhookVerifying == null" />
          <div v-else-if="isWebhookVerifying">
            <i class="ri-loader-4-line animate-spin text-gray-900 w-[14px] mr-2" />
            <span class="text-gray-900 text-[13px]">Verifying</span>
          </div>
          <div v-else-if="isWebhookValid">
            <i class="ri-check-line text-green-500 w-[14px] mr-2" />
            <span class="text-green-500 text-[13px]">Succesfully verified</span>
          </div>
          <div v-else>
            <i class="ri-error-warning-line text-red-500 w-[14px] mr-2" />
            <span class="text-red-500 text-[13px]">No webhooks received yet</span>
          </div>
        </div>
        <div
          class="text-2xs text-gray-500 leading-normal mb-1"
        >
          Confirm if your webhooks are properly configured and crowd.dev is receiving data from Discourse.
        </div>
      </el-card>
    </template>

    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :disabled="
            $v.$invalid
              || !hasFormChanged || loading"
          :loading="loading"
          @click="connect()"
        >
          {{ integration.settings?.forumHostname ? "Update" : "Connect" }}
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  ref, reactive, onMounted, computed, defineEmits, defineProps,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { required, url, helpers } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppDrawer from '@/shared/drawer/drawer.vue';
import {
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import AppFormItem from '@/shared/form/form-item.vue';
import formChangeDetector from '@/shared/form/form-change';
// import elementChangeDetector from '@/shared/form/element-change';
import { IntegrationService } from '@/modules/integration/integration-service';
import Message from '@/shared/message/message';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

const tenantId = AuthCurrentTenant.get();

const inputRef = ref();
const showToken = ref(false);

const payloadURL = ref(undefined);
const webhookSecret = ref(undefined);

const { doDiscourseConnect } = mapActions('integration');

const copyToClipboard = async (type) => {
  const toCopy = type === 'url' ? payloadURL : webhookSecret;
  await navigator.clipboard.writeText(toCopy.value);

  Message.success(
    `${
      type === 'url' ? 'Payload URL' : 'Webhook Secret'
    } successfully copied to your clipboard`,
  );
};

const onShowToken = () => {
  showToken.value = true;
  inputRef.value.focus();
};

function generateRandomSecret(length) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
  discourseURL: '',
  apiKey: '',
});

const isValidating = ref(false);
const isAPIConnectionValid = ref(false);
const loading = ref(false);
const isWebhookVerifying = ref(null);
const isWebhookValid = ref(false);

// validate that url doesn't end with a slash
const validateURL = (value) => {
  if (value && value.endsWith('/')) {
    return false;
  }
  return true;
};

const rules = {
  discourseURL: {
    required,
    url,
    noSlash: helpers.withMessage('URL cannot end with a slash', validateURL),
  },
  apiKey: {
    required,
  },
};

const $externalResults = ref({});

const $v = useVuelidate(rules, form, { $externalResults });

// validate method
async function validate() {
  $v.value.$clearExternalResults();
  // check if everything is valid
  if ($v.value.$error) return;

  isValidating.value = true;

  try {
    await IntegrationService.discourseValidateAPI(form.discourseURL, form.apiKey);
    isAPIConnectionValid.value = true;
    if (!payloadURL.value) {
      payloadURL.value = `${window.location.origin}/api/webhooks/discourse/${tenantId}`;
    }
    if (!webhookSecret.value) {
      webhookSecret.value = generateRandomSecret(32);
    }
  } catch {
    const errors = {
      apiKey: 'Invalid credentials',
    };
    $externalResults.value = errors;
    isAPIConnectionValid.value = false;
  }

  isValidating.value = false;
}

const onBlurDiscourseURL = async () => {
  $v.value.discourseURL.$touch();
  await validate();
};

const onBlurAPIKey = async () => {
  $v.value.apiKey.$touch();
  await validate();
};

const emit = defineEmits(['update:modelValue']);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const logoUrl = CrowdIntegrations.getConfig('discourse').image;

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
  if (!props.integration?.settings?.forumHostname) {
    form.apiKey = '';
    form.discourseURL = '';
    isValidating.value = false;
    isAPIConnectionValid.value = false;
    loading.value = false;
    isWebhookVerifying.value = null;
    isWebhookValid.value = false;
    $externalResults.value = {};
    $v.value.$reset();
  } else {
    form.discourseURL = props.integration?.settings?.forumHostname;
    form.apiKey = props.integration.settings.apiKey;
    webhookSecret.value = props.integration.settings.webhookSecret;
    payloadURL.value = `${window.location.origin}/api/webhooks/discourse/${tenantId}`;
    isAPIConnectionValid.value = true;
    isWebhookVerifying.value = null;
    isWebhookValid.value = false;
    $externalResults.value = {};
    $v.value.$reset();
  }
  formSnapshot();
};

onMounted(() => {
  if (props.integration?.settings?.forumHostname) {
    form.discourseURL = props.integration.settings.forumHostname;
    form.apiKey = props.integration.settings.apiKey;
    webhookSecret.value = props.integration.settings.webhookSecret;
    payloadURL.value = `${window.location.origin}/api/webhooks/discourse/${tenantId}`;
    isAPIConnectionValid.value = true;
  }
  formSnapshot();
});

const verifyWebhook = async () => {
  isWebhookVerifying.value = true;
  try {
    const webhookVerified = await IntegrationService.discourseVerifyWebhook(props.integration?.id);
    if (webhookVerified) {
      isWebhookValid.value = true;
    } else {
      isWebhookValid.value = false;
    }
  } catch {
    isWebhookValid.value = false;
  } finally {
    isWebhookVerifying.value = false;
  }
};

const connect = async () => {
  loading.value = true;

  doDiscourseConnect({
    forumHostname: form.discourseURL,
    apiKey: form.apiKey,
    webhookSecret: webhookSecret.value,
    isUpdate: props.integration.settings?.forumHostname,
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
