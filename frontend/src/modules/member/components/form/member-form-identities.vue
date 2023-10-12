<template>
  <div class="grid gap-x-12 grid-cols-4">
    <div v-if="showHeader">
      <h6>
        Identities <span class="text-red-500">*</span>
      </h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Connect with contributors' external data sources or
        profiles
      </p>
    </div>
    <div
      class="identities-form"
      :class="showHeader ? 'col-span-3' : 'col-span-4'"
    >
      <div
        v-for="[key, value] in Object.entries(
          identitiesForm,
        )"
        :key="key"
        class="border-b border-gray-200 last:border-none"
      >
        <div v-if="findPlatform(key)">
          <el-form-item class="h-14 !flex items-center">
            <div :class="value.imgContainerClass">
              <img
                :src="findPlatform(key).image"
                :alt="findPlatform(key).name"
                class="w-4 h-4"
              />
            </div>
            <el-switch
              v-model="value.enabled"
              :inactive-text="findPlatform(key).name"
              :disabled="editingDisabled(key)"
              @change="
                (newValue) => onSwitchChange(newValue, key)
              "
            />
          </el-form-item>

          <div v-if="value.enabled">
            <div
              v-for="(handle, ii) of model.username[key]"
              :key="ii"
              class="flex flex-grow gap-2 mt-1 pb-3 last:!mb-6 last:pb-0"
            >
              <el-form-item
                :prop="`username.${key}.${ii}`"
                required
                class="flex-grow"
              >
                <el-input
                  v-model="model.username[key][ii]"
                  placeholder="johndoe"
                  :disabled="editingDisabled(key) || key === 'linkedin'
                    && handle.includes(
                      'private-',
                    )"
                  :type="key === 'linkedin'
                    && handle.includes(
                      'private-',
                    ) ? 'password' : 'text'"
                  @input="(newValue) =>
                    onInputChange(newValue, key, value, ii)
                  "
                >
                  <template v-if="value.urlPrefix" #prepend>
                    <span>{{ value.urlPrefix }}</span>
                    <span class="text-red-500">*</span>
                  </template>
                </el-input>
                <template #error>
                  <div class="el-form-item__error">
                    Identity profile is required
                  </div>
                </template>
              </el-form-item>
              <el-button
                :disabled="editingDisabled(key)"
                class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
                @click="removeUsername(key, ii)"
              >
                <i class="ri-delete-bin-line text-lg" />
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-start justify-between mt-24">
        <div class="flex items-center flex-1">
          <app-platform platform="email" />
          <div class="font-medium text-sm ml-3">
            Email address
          </div>
        </div>
        <app-string-array-input
          v-model="computedModelEmails"
          class="flex-1"
          add-row-label="Add e-email address"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  reactive,
  computed,
  watch,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import cloneDeep from 'lodash/cloneDeep';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  record: {
    type: Object,
    default: () => {},
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(newModel) {
    emit('update:modelValue', newModel);
  },
});

const computedModelEmails = computed({
  get() {
    return model.value.emails?.length > 0
      ? model.value.emails
      : [''];
  },
  set(emails) {
    const nonEmptyEmails = emails.filter((e) => !!e);

    model.value.emails = nonEmptyEmails;
  },
});

watch(
  model.value,
  (newValue) => {
    // Handle platform value each time username object is updated
    const platforms = Object.keys(newValue.username || {});

    if (platforms.length) {
      [model.value.platform] = platforms;
    } else if (newValue.emails) {
      model.value.platform = 'emails';
    } else {
      model.value.platform = null;
    }
  },
  { deep: true },
);

const identitiesForm = reactive({
  devto: {
    enabled:
      props.modelValue.username?.devto !== undefined
      || false,
    urlPrefix: 'dev.to/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200',
  },
  discord: {
    enabled:
      props.modelValue.username?.discord !== undefined
      || false,
    urlPrefix: 'discord.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--discord cursor-auto hover:cursor-auto',
  },
  github: {
    enabled:
      props.modelValue.username?.github !== undefined
      || false,
    urlPrefix: 'github.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200',
  },
  slack: {
    enabled:
      props.modelValue.username?.slack !== undefined
      || false,
    urlPrefix: 'slack.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--slack cursor-auto hover:cursor-auto bg-white border border-gray-200',
  },
  twitter: {
    enabled:
      props.modelValue.username?.twitter !== undefined
      || false,
    urlPrefix: 'twitter.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--twitter',
  },
  linkedin: {
    enabled:
      props.modelValue.username?.linkedin !== undefined
      || false,
    urlPrefix: 'linkedin.com/in/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--linkedin',
  },
  reddit: {
    enabled:
      props.modelValue.username?.reddit !== undefined
      || false,
    urlPrefix: 'reddit.com/user/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--reddit',
  },
  hackernews: {
    enabled:
      props.modelValue.username?.hackernews !== undefined
      || false,
    urlPrefix: 'news.ycombinator.com/user?id=',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--hackernews',
  },
  git: {
    enabled:
      props.modelValue.username?.git !== undefined
      || false,
    urlPrefix: '',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--git',
  },
  stackoverflow: {
    enabled:
      props.modelValue.username?.stackoverflow
        !== undefined || false,
    urlPrefix: 'stackoverflow.com/users/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--stackoverflow',
  },
});

function findPlatform(platform) {
  return CrowdIntegrations.getConfig(platform);
}

function editingDisabled(platform) {
  if (['git'].includes(platform)) {
    return false;
  }
  return props.record
    ? props.record.activeOn.includes(platform)
    : false;
}

function onSwitchChange(value, key) {
  // Add platform to username object
  if (
    (model.value.username?.[key] === null
      || model.value.username?.[key] === undefined)
    && value
  ) {
    model.value.username[key] = props.record?.username?.[key]?.length ? cloneDeep(props.record.username[key]) : [''];
    return;
  }

  // Remove platform from username object
  if (!value) {
    delete model.value.username[key];
    delete model.value.attributes?.url?.[key];
  }

  // Handle platfom and attributes when username profiles are removed
  if (!Object.keys(model.value.username || {}).length) {
    delete model.value.platform;
    delete model.value.attributes?.url;
  }
}

function onInputChange(newValue, key, value, index) {
  if (index === 0) {
    model.value.attributes = {
      ...props.modelValue.attributes,
      url: {
        ...props.modelValue.attributes?.url,
        [key]: `https://${value.urlPrefix}${newValue}`,
      },
    };
  }
}

const removeUsername = (platform, index) => {
  model.value.username[platform].splice(index, 1);

  if (!model.value.username[platform]?.length) {
    delete model.value.username?.[platform];
    delete model.value.attributes?.url?.[platform];
    identitiesForm[platform].enabled = false;
  } else {
    model.value.attributes = {
      ...props.modelValue.attributes,
      url: {
        ...props.modelValue.attributes?.url,
        [platform]: CrowdIntegrations.getConfig(platform)?.url({ username: model.value.username[platform][0], attributes: model.value.attributes }),
      },
    };
  }
};
</script>
