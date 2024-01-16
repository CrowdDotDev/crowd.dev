<template>
  <div>
    <div v-if="showHeader">
      <h6>
        Identities <span class="text-brand-500">*</span>
      </h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Connect with contacts' external data sources or
        profiles
      </p>
    </div>
    <div>
      <section
        v-for="[key, value] in Object.entries(
          identitiesForm,
        )"
        :key="key"
        class="border-b border-gray-200 last:border-none pt-5 pb-6"
      >
        <div v-if="findPlatform(key)" class="flex">
          <div class="w-6 pt-2 mr-4">
            <img
              :src="findPlatform(key).image"
              :alt="findPlatform(key).name"
              class="w-6"
            />
          </div>
          <div class="flex-grow">
            <article
              v-for="(handle, ii) of model.username[key]"
              :key="ii"
              class="flex flex-grow gap-2 pb-3 last:pb-0"
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
                  <template #prepend>
                    <span class="font-medium text-gray-500">{{ value.urlPrefix }}</span>
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
                class="btn btn--md btn--transparent w-10 h-10"
                @click="removeUsername(key, ii)"
              >
                <i class="ri-delete-bin-line text-lg" />
              </el-button>
            </article>
          </div>
        </div>
      </section>
      <!--      <div class="flex items-start justify-between mt-24">-->
      <!--        <div class="flex items-center flex-1">-->
      <!--          <app-platform-icon-->
      <!--            platform="emails"-->
      <!--            size="small"-->
      <!--          />-->
      <!--          <div class="font-medium text-sm ml-3">-->
      <!--            Email address-->
      <!--          </div>-->
      <!--        </div>-->
      <!--        <app-string-array-input-->
      <!--          v-model="computedModelEmails"-->
      <!--          class="flex-1"-->
      <!--          add-row-label="Add e-email address"-->
      <!--        />-->
      <!--      </div>-->
    </div>
  </div>
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  reactive,
  computed,
  watch, onMounted,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import cloneDeep from 'lodash/cloneDeep';
import AppPlatformIcon from '@/shared/modules/platform/components/platform-icon.vue';

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

const identitiesForm = {
  devto: {
    urlPrefix: 'dev.to/',
  },
  discord: {
    urlPrefix: 'discord.com/',
  },
  github: {
    urlPrefix: 'github.com/',
  },
  slack: {
    urlPrefix: 'slack.com/',
  },
  twitter: {
    urlPrefix: 'twitter.com/',
  },
  linkedin: {
    urlPrefix: 'linkedin.com/in/',
  },
  reddit: {
    urlPrefix: 'reddit.com/user/',
  },
  hackernews: {
    urlPrefix: 'news.ycombinator.com/user?id=',
  },
  stackoverflow: {
    urlPrefix: 'stackoverflow.com/users/',
  },
};

const model = reactive({
  ...props.modelValue,
  username: Object.keys(identitiesForm).reduce((username, platform) => {
    console.log(platform);
    return {
      ...username,
      [platform]: props.modelValue.username[platform] ?? [''],
    };
  }),
});

// const computedModelEmails = computed({
//   get() {
//     return model.value.emails?.length > 0
//       ? model.value.emails
//       : [''];
//   },
//   set(emails) {
//     const nonEmptyEmails = emails.filter((e) => !!e);
//
//     model.value.emails = nonEmptyEmails;
//   },
// });

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

function findPlatform(platform) {
  return CrowdIntegrations.getConfig(platform);
}

function editingDisabled(platform) {
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
