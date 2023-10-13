<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-devto-drawer"
    title="DEV"
    pre-title="Integration"
    has-border
    @close="cancel()"
  >
    <template #beforeTitle>
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="DEV logo" />
    </template>
    <template #content>
      <el-form class="form integration-devto-form">
        <app-form-item
          class="mb-6"
          :validation="$v.apiKey"
          label="API Key"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <div class="text-2xs text-gray-500 leading-normal mb-1">
            Create a new API key in your DEV account's
            <a
              href="https://dev.to/settings/extensions#:~:text=DEV%20Community%20API%20Keys"
              target="_blank"
              rel="noopener noreferrer"
            >settings</a>
            page.
          </div>
          <el-input ref="focus" v-model="form.apiKey" @blur="onBlurAPIKey()">
            <template #suffix>
              <div
                v-if="isValidating"
                v-loading="isValidating"
                class="flex items-center justify-center w-6 h-6"
              />
            </template>
          </el-input>
        </app-form-item>
        <el-divider />
        <div
          class="flex flex-col gap-2 items-start"
          :class="isAPIConnectionValid ? 'opacity-100' : 'opacity-50'"
        >
          <span class="text-sm font-medium">Track organization articles</span>
          <span class="text-2xs font-light mb-2 text-gray-600">
            Monitor all articles from organization accounts
          </span>
          <el-form-item
            v-for="org in organizations"
            :key="org.id"
            class="mb-4 w-full"
            :class="{
              'is-error': org.touched && !org.valid,
              'is-success': org.touched && org.valid,
            }"
          >
            <div class="flex flex-row items-center w-full gap-4">
              <el-input
                id="devOrganization"
                v-model="org.username"
                class="text-green-500"
                spellcheck="false"
                placeholder="Enter organization slug"
                :disabled="!isAPIConnectionValid"
                @blur="handleOrganizationValidation(org.id)"
              >
                <template #prepend>
                  dev.to/
                </template>
                <template #suffix>
                  <div
                    v-if="org.validating"
                    v-loading="org.validating"
                    class="flex items-center justify-center w-6 h-6"
                  />
                </template>
              </el-input>
              <el-button
                v-if="!isLastOrganization"
                class="btn btn--md btn--transparent w-10 h-10"
                :disabled="!isAPIConnectionValid"
                @click="removeOrganization(org.id)"
              >
                <i class="ri-delete-bin-line text-lg text-black" />
              </el-button>
            </div>
            <span
              v-if="org.touched && !org.valid"
              class="el-form-item__error"
            >Organization slug is not valid</span>
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            :disabled="!isAPIConnectionValid"
            @click="addNewOrganization"
          >
            + Add organization link
          </el-button>
          <span class="text-sm font-medium mt-8">Track user articles</span>
          <span class="text-2xs font-light mb-2 text-gray-600">
            Monitor articles from individual users, such as team contacts or
            community advocates
          </span>
          <el-form-item
            v-for="user in users"
            :key="user.id"
            class="mb-4 w-full"
            :class="{
              'is-error': user.touched && !user.valid,
              'is-success': user.touched && user.valid,
            }"
          >
            <div class="flex flex-row items-center w-full gap-4">
              <el-input
                id="devUser"
                v-model="user.username"
                spellcheck="false"
                placeholder="Enter user slug"
                :disabled="!isAPIConnectionValid"
                @blur="handleUserValidation(user.id)"
              >
                <template #prepend>
                  dev.to/
                </template>
                <template #suffix>
                  <div
                    v-if="user.validating"
                    v-loading="user.validating"
                    class="flex items-center justify-center w-6 h-6"
                  />
                </template>
              </el-input>
              <el-button
                v-if="!isLastUser"
                class="btn btn--md btn--transparent w-10 h-10"
                :disabled="!isAPIConnectionValid"
                @click="removeUser(user.id)"
              >
                <i class="ri-delete-bin-line text-lg text-black" />
              </el-button>
            </div>
            <span
              v-if="user.touched && !user.valid"
              class="el-form-item__error"
            >User slug is not valid</span>
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            :disabled="!isAPIConnectionValid"
            @click="addNewUser"
          >
            + Add user link
          </el-button>
        </div>
      </el-form>
    </template>
    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--bordered mr-4"
          :disabled="loading"
          @click="cancel"
        >
          <app-i18n code="common.cancel" />
        </el-button>
        <el-button
          id="devConnect"
          class="btn btn--md btn--primary"
          :disabled="
            connectDisabled || loading || !isAPIConnectionValid || isValidating
          "
          :loading="loading"
          @click="save"
        >
          <app-i18n code="common.connect" />
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  computed,
  defineEmits,
  defineProps,
  watch,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import AppFormItem from '@/shared/form/form-item.vue';
// import elementChangeDetector from '@/shared/form/element-change';
import { IntegrationService } from '@/modules/integration/integration-service';

const { doDevtoConnect } = mapActions('integration');

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

const logoUrl = ref(CrowdIntegrations.getConfig('devto').image);
const users = ref([]);
const organizations = ref([]);
const loading = ref(false);
const isAPIConnectionValid = ref(false);
const isValidating = ref(false);

const connectDisabled = computed(() => {
  if (!isValid.value) {
    return true;
  }

  const validUsers = users.value.filter((u) => !!u.username);
  const validOrgs = organizations.value.filter((o) => !!o.username);

  const empty = validUsers.length + validOrgs.length === 0;

  if (props.integration.settings && !empty) {
    return (
      validUsers.length === props.integration.settings.users.length
      && validUsers.every((u) => props.integration.settings.users.includes(u.username))
      && validOrgs.length === props.integration.settings.organizations.length
      && validOrgs.every((o) => props.integration.settings.organizations.includes(o.username))
    );
  }

  return empty;
});

const isLastOrganization = computed(() => organizations.value.length === 1);

const isLastUser = computed(() => users.value.length === 1);

const isValid = computed(() => {
  const relevantUsers = users.value.filter((u) => !!u.username);

  if (relevantUsers.some((user) => !user.valid)) {
    return false;
  }

  const relevantOrganizations = organizations.value.filter((o) => !!o.username);
  if (relevantOrganizations.some((org) => !org.valid)) {
    return false;
  }

  return relevantUsers.length + relevantOrganizations.length > 0;
});

const maxId = computed(() => {
  if (users.value.length === 0 && organizations.value.length === 0) {
    return 0;
  }

  let maxId = -1;
  users.value.forEach((user) => {
    if (user.id > maxId) {
      maxId = user.id;
    }
  });

  organizations.value.forEach((org) => {
    if (org.id > maxId) {
      maxId = org.id;
    }
  });

  return maxId;
});

const syncData = () => {
  users.value = [];
  organizations.value = [];

  if (props.integration && props.integration.settings) {
    props.integration.settings.users.forEach((u) => addNewUser(u));
    props.integration.settings.organizations.forEach((o) => addNewOrganization(o));
  }

  if (users.value.length === 0) {
    addNewUser();
  }
  if (organizations.value.length === 0) {
    addNewOrganization();
  }
};

const addNewUser = (username) => {
  users.value.push({
    id: maxId.value + 1,
    username:
      typeof username === 'string' || username instanceof String
        ? username
        : '',
    touched: false,
    valid: false,
    validating: false,
  });
};

const removeUser = (id) => {
  users.value = users.value.filter((u) => u.id !== id);
};

const addNewOrganization = (username) => {
  organizations.value.push({
    id: maxId.value + 1,
    username:
      typeof username === 'string' || username instanceof String
        ? username
        : '',
    touched: false,
    valid: false,
    validating: false,
  });
};

const removeOrganization = (id) => {
  organizations.value = organizations.value.filter((o) => o.id !== id);
};

const handleUserValidation = async (id) => {
  const user = users.value.find((u) => u.id === id);

  try {
    user.validating = true;

    if (!user.username) {
      user.valid = false;
      return;
    }

    if (users.value.find((u) => u.id !== id && u.username === user.username)) {
      user.valid = false;
    } else {
      const result = await IntegrationService.devtoValidateUser(user.username);

      user.valid = !!result;
    }
  } catch (e) {
    console.error(e);
    user.valid = false;
  } finally {
    user.validating = false;
    user.touched = true;
  }
};

const handleOrganizationValidation = async (id) => {
  const organization = organizations.value.find((o) => o.id === id);

  try {
    organization.validating = true;

    if (!organization.username) {
      organization.valid = false;
      return;
    }

    if (
      organizations.value.find(
        (o) => o.id !== id && o.username === organization.username,
      )
    ) {
      organization.valid = false;
    } else {
      const result = await IntegrationService.devtoValidateOrganization(
        organization.username,
      );
      organization.valid = !!result;
    }
  } catch (e) {
    console.error(e);
    organization.valid = false;
  } finally {
    organization.validating = false;
    organization.touched = true;
  }
};

const onBlurAPIKey = async () => {
  $v.value.apiKey.$touch();
  await validateAPIKey();
};

const cancel = () => {
  isVisible.value = false;
  syncData();
};

const save = async () => {
  loading.value = true;

  const relevantOrganizations = organizations.value.filter((o) => !!o.username);
  const relevantUsers = users.value.filter((u) => !!u.username);
  await doDevtoConnect({
    users: relevantUsers.map((u) => u.username),
    organizations: relevantOrganizations.map((o) => o.username),
    apiKey: form.apiKey,
  });

  isVisible.value = false;
  loading.value = false;
};

const validateAPIKey = async () => {
  isValidating.value = true;
  $v.value.$clearExternalResults();
  const isValid = await IntegrationService.devtoValidateAPIKey(form.apiKey);
  if (isValid) {
    isAPIConnectionValid.value = true;
  } else {
    const errors = {
      apiKey: 'Invalid API key',
    };
    $externalResults.value = errors;
    isAPIConnectionValid.value = false;
  }
  isValidating.value = false;
};

const form = reactive({
  apiKey: '',
});

const rules = {
  apiKey: {
    required,
  },
};

const $externalResults = ref({});

const $v = useVuelidate(rules, form, { $externalResults });

watch(
  () => props.integration,
  (newVal) => {
    if (newVal) {
      syncData();
    }
  },
);

const emit = defineEmits(['update:modelValue']);

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});

onMounted(syncData);
</script>

<script>
export default {
  name: 'AppDevtoConnectDrawer',
};
</script>

<style lang="scss">
.integration-devto-form {
  .el-form-item {
    @apply mb-3;
    &__content {
      @apply mb-0;
    }
  }

  .el-input-group__prepend {
    @apply px-3;
  }
}
</style>
