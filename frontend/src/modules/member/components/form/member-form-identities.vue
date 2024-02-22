<template>
  <div>
    <!-- Identities editing -->
    <div>
      <section
        v-for="[key, value] in Object.entries(identitiesForm)"
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
              v-for="(handle, ii) of model[key]"
              :key="ii"
              class="flex flex-grow gap-2 pb-3 last:pb-0"
            >
              <el-input
                v-model="model[key][ii]"
                placeholder="johndoe"
                :disabled="editingDisabled(key) || key === 'linkedin'
                  && handle.includes(
                    'private-',
                  )"
                :type="key === 'linkedin'
                  && handle.includes(
                    'private-',
                  ) ? 'password' : 'text'"
              >
                <template v-if="value.urlPrefix?.length" #prepend>
                  <span class="font-medium text-gray-500">{{ value.urlPrefix }}</span>
                </template>
              </el-input>
              <el-button
                :disabled="model[key].length <= 1 || editingDisabled(key)"
                class="btn btn--md btn--transparent w-10 h-10"
                @click="removeUsername(key, ii)"
              >
                <i class="ri-delete-bin-line text-lg" />
              </el-button>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  watch,
  ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

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
});

// TODO: move this to identities config
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

const defaultValue = Object.keys(identitiesForm).reduce((identities, key) => ({
  ...identities,
  [key]: [''],
}), {});

const model = ref({ ...defaultValue });

watch(
  props.modelValue,
  (contact, previous) => {
    if (!previous) {
      model.value = {
        ...defaultValue,
        ...(contact?.username || {}),
      };
    }
  },
  { deep: true, immediate: true },
);

watch(
  model,
  (value) => {
    // Parse username object
    const username = Object.keys(identitiesForm).reduce((obj, platform) => {
      const usernames = (value[platform] || []).filter((username) => !!username.trim());
      return {
        ...obj,
        [platform]: usernames,
      };
    }, {});

    // Get url object from usernames
    const url = Object.keys(username).reduce((urls, p) => {
      if (username[p]?.length) {
        return {
          ...urls,
          [p]: CrowdIntegrations.getConfig(p)?.url({ username: model.value[p][0], attributes: model.value.attributes }),
        };
      }
      return urls;
    }, {});

    const identities = {
      ...props.modelValue.username,
      ...username,
    };

    Object.keys(identities).forEach((platform) => {
      identities[platform] = identities[platform].filter((i) => i.trim().length);
      if (identities[platform].length === 0) {
        delete identities[platform];
      }
    });

    // Get platforms from usernames
    const platforms = Object.keys(identities || {});
    const platform = platforms.length ? platforms[0] : null;

    // Emit updated member
    emit('update:modelValue', {
      ...props.modelValue,
      username: identities,
      platform: platform || props.modelValue.platform,
      identities: platforms,
      attributes: {
        ...props.modelValue.attributes,
        url,
      },
    });
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

const removeUsername = (platform, index) => {
  model.value[platform].splice(index, 1);
};
</script>
