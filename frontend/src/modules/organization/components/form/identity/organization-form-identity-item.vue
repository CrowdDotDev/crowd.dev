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
        v-model="model.username"
        placeholder="johndoe"
        :disabled="(platform === 'linkedin'
          && model.username.includes(
            'private-',
          )) && !!props.identity.username"
        :type="platform === 'linkedin'
          && model.username.includes(
            'private-',
          ) ? 'password' : 'text'"
        class="!h-8"
      >
        <template v-if="prefixes[model.platform]?.length" #prepend>
          <span class="font-medium text-gray-500">{{ prefixes[model.platform] }}</span>
        </template>
        <template #suffix>
          <div v-if="model.username !== props.identity.username || !props.identity.username" class="flex gap-1 -mr-1">
            <cr-button
              size="tiny"
              :icon-only="true"
              :disabled="model.username === props.identity.username"
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
        <span class="font-medium">{{ props.identity.username || props.identity.name }}</span>
        <span class="text-gray-400">{{ props.identity.platform }}</span>
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
        :disabled="model.username === props.identity.username"
      >
        <cr-dropdown-item
          :disabled="model.username !== props.identity.username"
          @click="emit('unmerge', {
            platform: props.identity.platform as string,
            username: props.identity.username as string,
          })"
        >
          <i class="ri-link-unlink" />
          Unmerge identity
        </cr-dropdown-item>
      </el-tooltip>
      <cr-dropdown-separator />
      <cr-dropdown-item
        type="danger"
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
import CrButton from '@/ui-kit/button/Button.vue';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import CrDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import AppSvg from '@/shared/svg/svg.vue';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';

const emit = defineEmits<{(e: 'update', value: OrganizationIdentity): void,
  (e: 'unmerge', value: { platform: string, username: string }): void,
  (e: 'remove'): void,
  (e: 'clear'): void}>();

const props = withDefaults(defineProps<{
  identity: OrganizationIdentity,
  organization: Organization,
  actionsDisabled?: boolean,
  editable?: boolean,
}>(), {
  actionsDisabled: false,
  editable: true,
});

const model = ref<OrganizationIdentity>({ ...props.identity });

const platform = computed(() => CrowdIntegrations.getConfig(props.identity.platform));

const prefixes: Record<string, string> = {
  github: 'github.com/',
  linkedin: 'linkedin.com/company/',
  twitter: 'twitter.com/',
  crunchbase: 'crunchbase.com/organization/',
};

const update = () => {
  emit('update', {
    ...props.identity,
    username: model.value.username,
  });
};

const clear = () => {
  model.value.username = props.identity.username;
  emit('clear');
};
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationFormIdentityItem',
};
</script>
