<template>
  <div>
    <!-- Identities editing -->
    <div>
      <section
        v-for="[key, value] in Object.entries(identitiesForm)"
        :key="key"
        class="border-b border-gray-200 last:border-none py-4"
      >
        <div v-if="findPlatform(key)" class="flex">
          <div class="w-6 pt-1.5 mr-3">
            <img
              :src="findPlatform(key).image"
              :alt="findPlatform(key).name"
              class="w-5"
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
                    class="!h-8"
                  >
                    <template v-if="value.urlPrefix?.length" #prepend>
                      <span class="font-medium text-gray-500">{{ value.urlPrefix }}</span>
                    </template>
                    <template #suffix>
                      <i
                        v-if="identity.value && identity.verified"
                        class="ri-verified-badge-fill text-brand-500 text-base leading-4"
                      />
                    </template>
                  </el-input>

                  <el-dropdown trigger="click" placement="bottom-end" :teleported="false">
                    <cr-button type="tertiary-light-gray" size="small" :icon-only="true">
                      <i class="ri-more-fill" />
                    </cr-button>
                    <template #dropdown>
                      <el-dropdown-item
                        v-if="props.record.identities?.[ii]?.value && props.showUnmerge && staticIdentities.length > 1"
                        :disabled="!props.record.identities?.[ii]
                          || props.modelValue.identities?.[ii]?.value !== props.record.identities?.[ii]?.value"
                        @click="emit('unmerge', {
                          platform: key,
                          username: props.record.identities?.[ii].value,
                        })"
                      >
                        <el-tooltip
                          content="Not possible to unmerge an unsaved identity"
                          placement="top-end"
                          :disabled="!props.record.identities?.[ii]?.value || props.record.identities?.[ii]
                            && props.modelValue.identities?.[ii]?.value === props.record.identities?.[ii]?.value"
                        >
                          <div class="flex items-center">
                            <i class="ri-link-unlink-m text-gray-600 mr-3 text-base" />
                            <span>Unmerge identity</span>
                          </div>
                        </el-tooltip>
                      </el-dropdown-item>

                      <template v-if="identity.value">
                        <el-dropdown-item v-if="!identity.verified" :disabled="editingDisabled(key)" @click="verifyIdentity(ii)">
                          <i class="ri-verified-badge-line text-gray-600 mr-3 text-base" />
                          <span>Verify identity</span>
                        </el-dropdown-item>
                        <el-dropdown-item v-else :disabled="editingDisabled(key) && identity.sourceId" @click="unverifyIdentity(ii)">
                          <el-tooltip
                            content="Identities tracked from Integrations can’t be unverified"
                            placement="top-end"
                            :disabled="!identity.sourceId"
                          >
                            <div class="flex items-center">
                              <app-svg name="unverify" class="text-gray-600 mr-3 !h-4 !w-4 min-w-[1rem]" />
                              <span>Unverify identity</span>
                            </div>
                          </el-tooltip>
                        </el-dropdown-item>
                        <el-divider />
                      </template>

                      <el-dropdown-item
                        :disabled="getPlatformIdentities(key).length <= 1 || editingDisabled(key)"
                        @click="removeIdentity(ii)"
                      >
                        <div
                          class="flex items-center"
                          :class="(getPlatformIdentities(key).length <= 1 || editingDisabled(key)) ? '!opacity-50' : ''"
                        >
                          <i class="ri-delete-bin-6-line !text-red-600 mr-3 text-base" />
                          <span class="text-red-600">Delete identity</span>
                        </div>
                      </el-dropdown-item>
                    </template>
                  </el-dropdown>
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
import AppSvg from '@/shared/svg/svg.vue';
import CrButton from '@/ui-kit/button/Button.vue';

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
  git: {
    urlPrefix: '',
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

function editingDisabled(platform) {
  if (['git'].includes(platform)) {
    return false;
  }
  return props.record
    ? props.record.activeOn?.includes(platform)
    : false;
}

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

const verifyIdentity = (index) => {
  const identity = { ...model.value.identities[index], verified: true };
  model.value.identities.splice(index, 1, identity);
};

const unverifyIdentity = (index) => {
  const identity = { ...model.value.identities[index], verified: false };
  model.value.identities.splice(index, 1, identity);
};

watch(() => model.value.identities, () => {
  addEmptyIdentities();
}, { deep: true });

onMounted(() => {
  addEmptyIdentities();
});
</script>
