<template>
  <article class="flex items-center">
    <div class="mr-3">
      <img
        v-if="platform"
        :src="platform.image"
        :alt="platform.name"
        class="w-5"
      />
      <i v-else class="text-lg ri-fingerprint-line" />
    </div>
    <div class="flex-grow">
      <el-input
        v-if="props.editable"
        v-model="model.value"
        placeholder="johndoe"
        :disabled="(editingDisabled || (platform === 'linkedin'
          && model.value.includes(
            'private-',
          ))) && !!props.identity.value"
        :type="platform === 'linkedin'
          && model.value.includes(
            'private-',
          ) ? 'password' : 'text'"
        class="!h-8"
      >
        <template v-if="prefixes[model.platform]?.length" #prepend>
          <span class="font-medium text-gray-500">{{ prefixes[model.platform] }}</span>
        </template>
        <template #suffix>
          <div v-if="model.value === props.identity.value && props.identity.value">
            <i
              v-if="model.value && props.identity.verified"
              class="ri-verified-badge-fill text-primary-500 text-base leading-4"
            />
          </div>
          <div v-else class="flex gap-1 -mr-1">
            <cr-button
              size="tiny"
              :icon-only="true"
              :disabled="model.value === props.identity.value"
              @click="update()"
            >
              <i class="ri-check-fill" />
            </cr-button>
            <cr-button
              size="tiny"
              type="secondary"
              :icon-only="true"
              @click="clear()"
            >
              <i class="ri-close-line" />
            </cr-button>
          </div>
        </template>
      </el-input>
      <p v-else class="text-xs gap-2 flex items-center">
        <span class="font-medium">{{ props.identity.value }}</span>
        <span class="text-gray-400">{{ props.identity.platform }}</span>
        <i
          v-if="props.identity.verified"
          class="ri-verified-badge-fill text-primary-500 text-base leading-4"
        />
      </p>
    </div>
    <cr-dropdown placement="bottom-end" width="15rem" class="ml-3">
      <template #trigger>
        <cr-button
          type="tertiary-light-gray"
          size="small"
          :icon-only="true"
          class="relative"
          :disabled="props.actionsDisabled"
        >
          <i
            class="ri-more-fill"
          />
        </cr-button>
      </template>

      <el-tooltip
        content="Not possible to unmerge an unsaved identity"
        placement="top-end"
        :disabled="model.value === props.identity.value"
      >
        <cr-dropdown-item
          :disabled="model.value !== props.identity.value"
          @click="emit('unmerge', {
            platform: props.identity.platform,
            username: props.identity.value,
          })"
        >
          <i class="ri-link-unlink" />
          Unmerge identity
        </cr-dropdown-item>
      </el-tooltip>
      <cr-dropdown-item
        v-if="!props.identity.verified"
        @click="verify(true)"
      >
        <i class="ri-verified-badge-line" />
        Verify identity
      </cr-dropdown-item>
      <el-tooltip
        v-else
        content="Identities tracked from Integrations can’t be unverified"
        placement="top-end"
        :disabled="!props.identity.sourceId"
      >
        <cr-dropdown-item
          :disabled="!!props.identity.sourceId"
          @click="verify(false)"
        >
          <app-svg name="unverify" class="!h-4 !w-4" />
          Unverify identity
        </cr-dropdown-item>
      </el-tooltip>

      <cr-dropdown-separator />
      <cr-dropdown-item
        type="danger"
        :disabled="editingDisabled"
        @click="emit('remove')"
      >
        <i class="ri-delete-bin-6-line" />
        Delete identity
      </cr-dropdown-item>
    </cr-dropdown>
  </article>
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { Member, MemberIdentity } from '@/modules/member/types/Member';
import CrButton from '@/ui-kit/button/Button.vue';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import CrDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import AppSvg from '@/shared/svg/svg.vue';

const emit = defineEmits<{(e: 'update', value: MemberIdentity): void,
  (e: 'unmerge', value: { platform: string, username: string }): void,
  (e: 'remove'): void,
  (e: 'clear'): void}>();

const props = withDefaults(defineProps<{
  identity: MemberIdentity,
  member: Member,
  actionsDisabled?: boolean,
  editable?: boolean,
}>(), {
  actionsDisabled: false,
  editable: true,
});

const model = ref({ ...props.identity });

const platform = computed(() => CrowdIntegrations.getConfig(props.identity.platform));

const prefixes: Record<string, string> = {
  devto: 'dev.to/',
  discord: 'discord.com/',
  github: 'github.com/',
  slack: 'slack.com/',
  twitter: 'twitter.com/',
  linkedin: 'linkedin.com/in/',
  reddit: 'reddit.com/user/',
  hackernews: 'news.ycombinator.com/user?id=',
  stackoverflow: 'stackoverflow.com/users/',
};

const editingDisabled = computed(() => {
  if (['git'].includes(props.identity.platform)) {
    return false;
  }
  return props.member
    ? props.member.activeOn?.includes(props.identity.platform)
    : false;
});

const update = () => {
  emit('update', {
    ...props.identity,
    value: model.value.value,
  });
};

const clear = () => {
  model.value.value = props.identity.value;
  emit('clear');
};

const verify = (verified: boolean) => {
  emit('update', {
    ...props.identity,
    verified,
  });
};
</script>

<script lang="ts">
export default {
  name: 'AppMemberFormIdentityItem',
};
</script>
