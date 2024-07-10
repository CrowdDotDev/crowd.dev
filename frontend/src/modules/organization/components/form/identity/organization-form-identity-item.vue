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
        :disabled="(platform === 'linkedin'
          && model.value?.includes(
            'private-',
          )) && !!props.identity.value"
        :type="platform === 'linkedin'
          && model.value?.includes(
            'private-',
          ) ? 'password' : 'text'"
        class="!h-8"
      >
        <template v-if="model.platform && prefixes[model.platform]?.length" #prepend>
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
            <lf-button
              size="tiny"
              :icon-only="true"
              :disabled="model.value === props.identity.value"
              @click="update()"
            >
              <i class="ri-check-fill" />
            </lf-button>
            <lf-button
              size="tiny"
              type="secondary"
              :icon-only="true"
              @click="clear()"
            >
              <i class="ri-close-line" />
            </lf-button>
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
    <lf-dropdown placement="bottom-end" width="15rem" class="ml-3">
      <template #trigger>
        <lf-button
          type="secondary-ghost-light"
          size="small"
          :icon-only="true"
          class="relative"
          :disabled="props.actionsDisabled"
        >
          <i
            class="ri-more-fill"
          />
        </lf-button>
      </template>

      <el-tooltip
        content="Not possible to unmerge an unsaved identity"
        placement="top-end"
        :disabled="model.value === props.identity.value"
      >
        <lf-dropdown-item
          :disabled="model.value !== props.identity.value"
          @click="emit('unmerge', {
            platform: props.identity.platform as string,
            value: props.identity.value as string,
            type: props.identity.type as string,
            verified: props.identity.verified as boolean,
          })"
        >
          <i class="ri-link-unlink" />
          Unmerge identity
        </lf-dropdown-item>
      </el-tooltip>
      <el-tooltip
        v-if="!props.identity.verified"
        content="Identities tracked from Integrations can’t be verified"
        placement="top-end"
        :disabled="!isVerifyDisabled"
      >
        <lf-dropdown-item
          :disabled="isVerifyDisabled"
          @click="verify(true)"
        >
          <i class="ri-verified-badge-line" />
          Verify identity
        </lf-dropdown-item>
      </el-tooltip>
      <el-tooltip
        v-else
        content="Identities tracked from Integrations can’t be unverified"
        placement="top-end"
        :disabled="!isVerifyDisabled"
      >
        <lf-dropdown-item
          :disabled="isVerifyDisabled"
          @click="verify(false)"
        >
          <app-svg name="unverify" class="!h-4 !w-4" />
          Unverify identity
        </lf-dropdown-item>
      </el-tooltip>

      <lf-dropdown-separator />
      <lf-dropdown-item
        type="danger"
        @click="emit('remove')"
      >
        <i class="ri-delete-bin-6-line" />
        Delete identity
      </lf-dropdown-item>
    </lf-dropdown>
  </article>
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';
import AppSvg from '@/shared/svg/svg.vue';

const emit = defineEmits<{(e: 'update', value: OrganizationIdentity): void,
  (e: 'unmerge', value: { platform: string, value: string, type: string, verified: boolean }): void,
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

const isVerifyDisabled = computed(
  () => !!props.identity.sourceId || ['integration', 'lfid'].includes(props.identity.platform),
);

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
  name: 'AppOrganizationFormIdentityItem',
};
</script>
