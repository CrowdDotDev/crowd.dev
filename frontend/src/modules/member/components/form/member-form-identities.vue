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
            <template v-for="(identity, ii) of model.identities" :key="ii">
              <template v-if="identity.platform === key && identity.type === 'username'">
                <article
                  class="flex flex-grow items-center gap-2 pb-3 last:pb-0"
                >
                  <el-input
                    v-model="model.identities[ii].value"
                    placeholder="johndoe"
                    :disabled="editingDisabled(key) || key === 'linkedin'
                      && identity.value.includes(
                        'private-',
                      )"
                    :type="key === 'linkedin'
                      && identity.value.includes(
                        'private-',
                      ) ? 'password' : 'text'"
                  >
                    <template v-if="value.urlPrefix?.length" #prepend>
                      <span class="font-medium text-gray-500">{{ value.urlPrefix }}</span>
                    </template>
                  </el-input>
                  <el-tooltip
                    v-if="props.showUnmerge && staticIdentities.length > 1"
                    :disabled="!props.record.identities?.[ii]?.value || props.record.identities?.[ii]
                      && props.modelValue.identities?.[ii]?.value === props.record.identities?.[ii]?.value"
                    content="Not possible to unmerge an unsaved identity"
                    placement="top"
                  >
                    <div>
                      <el-button
                        class="btn btn--md btn--transparent block w-8 !h-8 p-0"
                        :disabled="!props.record.identities?.[ii]
                          || props.modelValue.identities?.[ii]?.value !== props.record.identities?.[ii]?.value"
                        @click="emit('unmerge', {
                          platform: key,
                          username: props.record.identities?.[ii].value,
                        })"
                      >
                        <i class="ri-link-unlink-m text-lg" />
                      </el-button>
                    </div>
                  </el-tooltip>

                  <el-button
                    :disabled="getPlatformIdentities(key).length <= 1 || editingDisabled(key)"
                    class="btn btn--md btn--transparent w-8 !h-8"
                    @click="removeIdentity(ii)"
                  >
                    <i class="ri-delete-bin-line text-lg" />
                  </el-button>
                </article>
              </template>
            </template>
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
  computed, onMounted, watch,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import isEqual from 'lodash/isEqual';

const emit = defineEmits(['update:modelValue', 'unmerge']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  record: {
    type: Object,
    default: () => {},
  },
  showUnmerge: {
    type: Boolean,
    default: false,
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

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const getPlatformIdentities = (platform) => props.modelValue.identities.filter((i) => i.platform === platform);

const findPlatform = (platform) => CrowdIntegrations.getConfig(platform);

const editingDisabled = (platform) => (props.record
  ? props.record.activeOn?.includes(platform)
  : false);

const addEmptyIdentities = () => {
  const usedPlatforms = [...new Set(model.value.identities
    .filter((i) => i.type !== 'email')
    .map((i) => i.platform))];
  const unused = Object.keys(identitiesForm)
    .filter((p) => !usedPlatforms.includes(p))
    .map((p) => ({
      platform: p,
      type: 'username',
      value: '',
      verified: true,
    }));

  if (unused.length > 0) {
    model.value.identities = [...model.value.identities, ...unused];
  }
};

const staticIdentities = computed(() => props.record.identities.filter((i) => i.type === 'username'));

const removeIdentity = (index) => {
  model.value.identities.splice(index, 1);
};

watch(() => model.value.identities, () => {
  addEmptyIdentities();
}, { deep: true });

onMounted(() => {
  addEmptyIdentities();
});
</script>
