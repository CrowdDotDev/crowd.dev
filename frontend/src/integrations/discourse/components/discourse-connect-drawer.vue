<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="Discourse"
    size="600px"
    pre-title="Integration"
    :show-footer="false"
    has-border
    @close="isVisible = false"
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
        class="form pt-6 pb-10"
      >
        <app-form-item
          class="col-span-2 mb-6"
          :validation="$v.discourseURL"
          label="Discourse URL"
          :required="true"
          :error-messages="{
            required: 'This field is required',
            url: 'Enter valid URL',
          }"
        >
          <span class="text-2xs font-light text-gray-600">
            Hostname of your community instance in Discourse.
          </span>
          <el-input
            ref="focus"
            v-model="form.discourseURL"
            placeholder="https://community.crowd.dev"
            @blur="$v.discourseURL.$touch && validate()"
          />
        </app-form-item>
        <app-form-item
          class="col-span-2 mb-6"
          :validation="$v.apiKey"
          label="API Key"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <span class="text-2xs font-light text-gray-600 leading-none">
            Create a new API key in your Discourse account's settings page. You must be an admin user to connect your acount. Read more
          </span>
          <el-input
            ref="focus"
            v-model="form.apiKey"
            @blur="$v.apiKey.$touch && validate()"
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
      <el-form>
        <el-form
          class="col-span-2 api-keys-form flex flex-col gap-2"
          label-position="top"
        >
          <el-form-item label="Tenant ID">
            <div
              class="text-2xs text-gray-500 leading-normal mb-1"
            >
              Workspace identifier
            </div>
            <el-input :value="tenantId" :readonly="true">
              <template #append>
                <el-tooltip
                  content="Copy to clipboard"
                  placement="top"
                >
                  <el-button
                    class="append-icon"
                    @click="copyToClipboard('tenantId')"
                  >
                    <i class="ri-file-copy-line" />
                  </el-button>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="Auth Token">
            <el-input
              ref="inputRef"
              :value="jwtToken"
              readonly
              :type="showToken ? 'text' : 'password'"
            >
              <template #append>
                <el-tooltip
                  v-if="!showToken"
                  content="Show Auth Token"
                  placement="top"
                >
                  <el-button
                    class="append-icon"
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
                  <el-button @click="copyToClipboard('token')">
                    <i class="ri-file-copy-line" />
                  </el-button>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </el-form>
    </template>

    <template #footer />
  </app-drawer>
</template>

<script setup>
import {
  ref, reactive, onMounted, watch, computed, defineEmits, defineProps,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { required, url } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppDrawer from '@/shared/drawer/drawer.vue';
import {
  mapActions,
  mapGetters,
  mapState,
} from '@/shared/vuex/vuex.helpers';
import AppFormItem from '@/shared/form/form-item.vue';
import formChangeDetector from '@/shared/form/form-change';
import elementChangeDetector from '@/shared/form/element-change';
import { IntegrationService } from '@/modules/integration/integration-service';
import Message from '@/shared/message/message';

const inputRef = ref();
const showToken = ref(false);

const tenantId = 'fokfobkfbmfk';
const jwtToken = 'slf,blfbfbijfsb[fb]';

const copyToClipboard = async (type) => {
  const toCopy = type === 'token' ? jwtToken : tenantId;
  await navigator.clipboard.writeText(toCopy);

  Message.success(
    `${
      type === 'token' ? 'Auth Token' : 'Tenant ID'
    } successfully copied to your clipboard`,
  );
};

const onShowToken = () => {
  showToken.value = true;
  inputRef.value.focus();
};

const props = defineProps({
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

const rules = {
  discourseURL: {
    required, url,
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
  if (!await $v.value.$validate()) return;

  isValidating.value = true;

  try {
    await IntegrationService.discourseValidateAPI(form.discourseURL, form.apiKey);
    isAPIConnectionValid.value = true;
  } catch {
    const errors = {
      apiKey: 'Invalid credentials',
    };
    $externalResults.value = errors;
    isAPIConnectionValid.value = false;
  }

  isValidating.value = false;
}

const emit = defineEmits(['update:modelValue']);

const logoUrl = CrowdIntegrations.getConfig('discourse').image;

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});
</script>

<script>
export default {
  name: 'AppZapierConnectDrawer',
};
</script>
