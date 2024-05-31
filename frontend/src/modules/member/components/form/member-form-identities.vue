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
                        class="ri-verified-badge-fill text-primary-500 text-base leading-4"
                      />
                    </template>
                  </el-input>
                  <lf-button
                    :id="`identityRef-${ii}`"
                    :ref="(el) => setActionBtnsRef(el, ii)"
                    type="secondary-ghost-light"
                    size="small"
                    :icon-only="true"
                    class="relative"
                    @click.prevent.stop="() => onActionBtnClick(ii)"
                  >
                    <i
                      :id="`identityRefIcon-${ii}`"
                      class="ri-more-fill"
                    />
                  </lf-button>
                </article>
              </template>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
  <el-popover
    v-if="identityDropdown !== null"
    placement="bottom-end"
    popper-class="popover-dropdown"
    :virtual-ref="actionBtnRefs[identityDropdown]"
    trigger="click"
    :visible="identityDropdown !== null"
    virtual-triggering
    width="240"
    @update:visible="!$event ? identityDropdown = null : null"
  >
    <div v-click-outside="onClickOutside">
      <el-tooltip
        v-if="props.record.identities?.[identityDropdown]?.value && props.showUnmerge && staticIdentities.length > 1"
        content="Not possible to unmerge an unsaved identity"
        placement="top-end"
        :disabled="!props.record.identities?.[identityDropdown]?.value || props.record.identities?.[identityDropdown]
          && props.modelValue.identities?.[identityDropdown]?.value === props.record.identities?.[identityDropdown]?.value"
      >
        <div class=" w-full">
          <button
            type="button"
            class="el-dropdown-menu__item w-full"
            :disabled="!props.record.identities?.[identityDropdown]
              || props.modelValue.identities?.[identityDropdown]?.value !== props.record.identities?.[identityDropdown]?.value"
            @click="emit('unmerge', {
              platform: props.modelValue.identities?.[identityDropdown]?.platform,
              username: props.record.identities?.[identityDropdown].value,
            }); identityDropdown = null"
          >
            <div class="flex items-center">
              <i class="ri-link-unlink-m text-gray-600 mr-3 text-base" />
              <span>Unmerge identity</span>
            </div>
          </button>
        </div>
      </el-tooltip>
      <template v-if="props.modelValue.identities?.[identityDropdown].value">
        <button
          v-if="!props.modelValue.identities?.[identityDropdown].verified"
          type="button"
          class="el-dropdown-menu__item w-full"
          :disabled="editingDisabled(props.modelValue.identities?.[identityDropdown].platform)"
          @click="verifyIdentity(identityDropdown); identityDropdown = null"
        >
          <i class="ri-verified-badge-line text-gray-600 mr-3 text-base" />
          <span>Verify identity</span>
        </button>
        <el-tooltip
          v-else
          content="Identities tracked from Integrations can’t be unverified"
          placement="top-end"
          :disabled="!props.modelValue.identities?.[identityDropdown].sourceId"
        >
          <div class="w-full">
            <button
              type="button"
              class="el-dropdown-menu__item w-full"
              :disabled="editingDisabled(props.modelValue.identities?.[identityDropdown].platform)
                && props.modelValue.identities?.[identityDropdown]?.sourceId"
              @click="unverifyIdentity(identityDropdown); identityDropdown = null"
            >
              <div class="flex items-center">
                <app-svg name="unverify" class="text-gray-600 mr-3 !h-4 !w-4 min-w-[1rem]" />
                <span>Unverify identity</span>
              </div>
            </button>
          </div>
        </el-tooltip>
        <el-divider />
      </template>

      <button
        type="button"
        class="el-dropdown-menu__item w-full"
        :disabled="getPlatformIdentities(props.modelValue.identities?.[identityDropdown].platform).length <= 1 || editingDisabled(key)"
        @click="removeIdentity(identityDropdown); identityDropdown = null"
      >
        <div
          class="flex items-center"
          :class="(getPlatformIdentities(props.modelValue.identities?.[identityDropdown].platform).length <= 1
            || editingDisabled(key)) ? '!opacity-50' : ''"
        >
          <i class="ri-delete-bin-6-line !text-red-600 mr-3 text-base" />
          <span class="text-red-600">Delete identity</span>
        </div>
      </button>
    </div>
  </el-popover>
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  computed, onMounted, watch, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppSvg from '@/shared/svg/svg.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { ClickOutside as vClickOutside } from 'element-plus';

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

const actionBtnRefs = ref({});
const identityDropdown = ref(null);
const setActionBtnsRef = (el, index) => {
  if (el) {
    actionBtnRefs.value[index] = el;
  }
};

const onActionBtnClick = (index) => {
  if (identityDropdown.value === index) {
    identityDropdown.value = null;
  } else {
    identityDropdown.value = index;
  }
};

const onClickOutside = (el) => {
  if (!el.target?.id.includes('identityRef')) {
    identityDropdown.value = null;
  }
};

watch(() => model.value.identities, () => {
  addEmptyIdentities();
}, { deep: true });

onMounted(() => {
  addEmptyIdentities();
});
</script>

<style lang="scss" scoped>
.el-dropdown__popper .el-dropdown__list {
  @apply p-2;
}

// Override divider margin
.el-divider--horizontal {
  @apply my-2;
}

.el-dropdown-menu__item:disabled {
  @apply cursor-not-allowed text-gray-400;
}

.el-dropdown-menu__item:disabled:hover {
  @apply bg-white;
}
</style>
