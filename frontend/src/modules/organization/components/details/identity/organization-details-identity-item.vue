<template>
  <article
    class="flex items-start organization-identity-item"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="mt-0.5">
      <lf-tooltip
        v-if="platform(props.identity.platform)"
        placement="top-start"
        :content="platform(props.identity.platform).name"
      >
        <img
          :src="platform(props.identity.platform)?.image"
          class="h-5 w-5 object-contain"
          :alt="props.identity.value"
        />
      </lf-tooltip>
      <lf-tooltip v-else content="Custom identity" placement="top-start">
        <lf-icon
          name="fingerprint-fill"
          :size="20"
          class="text-gray-600"
        />
      </lf-tooltip>
    </div>

    <div class="pl-3 flex-grow">
      <div class="flex items-center">
        <div class=" flex items-center">
          <p v-if="!props.identity.url" class="text-medium max-w-48 truncate">
            {{ props.identity.handle ?? props.identity.value }}
          </p>
          <a
            v-else
            :href="props.identity.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 max-w-48 truncate"
          >
            {{ props.identity.handle ?? props.identity.value }}
          </a>
        </div>
        <lf-tooltip v-if="props.identity.verified" content="Verified identity">
          <lf-icon
            name="verified-badge-line"
            :size="16"
            class="ml-1 text-primary-500"
          />
        </lf-tooltip>
      </div>
    </div>

    <!-- Dropdown -->
    <lf-dropdown v-if="hovered && hasPermission(LfPermission.organizationEdit)" placement="bottom-end" width="232px">
      <template #trigger>
        <lf-button type="secondary-ghost" size="small" :icon-only="true">
          <lf-icon name="more-fill" />
        </lf-button>
      </template>
      <!-- Edit identity -->
      <lf-dropdown-item
        class="w-full"
        @click="emit('edit')"
      >
        <lf-icon name="pencil-line" />Edit identity
      </lf-dropdown-item>

      <lf-dropdown-separator />

      <!-- Verified -->
      <lf-tooltip
        v-if="props.identity.verified"
        placement="top"
        :disabled="!isVerifyDisabled"
        class="!w-full"
      >
        <template #content>
          Identities tracked from an Integrations<br> can’t be unverified
        </template>
        <lf-dropdown-item
          v-if="props.identity.verified"
          placement="top"
          :disabled="isVerifyDisabled"
          class="w-full"
          @click="verifyIdentity(false)"
        >
          <lf-svg name="unverify" class="!h-4 !w-4 text-gray-600" />Unverify identity
        </lf-dropdown-item>
      </lf-tooltip>
      <lf-tooltip
        v-else
        placement="top"
        :disabled="!isVerifyDisabled"
        class="!w-full"
      >
        <template #content>
          Identities tracked from an Integrations<br> can’t be verified
        </template>
        <lf-dropdown-item
          :disabled="isVerifyDisabled"
          class="w-full"
          @click="verifyIdentity(true)"
        >
          <lf-icon name="verified-badge-line" />Verify identity
        </lf-dropdown-item>
      </lf-tooltip>

      <!-- Unmerge -->
      <lf-dropdown-item @click="emit('unmerge')">
        <lf-icon name="link-unlink" />Unmerge identity
      </lf-dropdown-item>

      <lf-dropdown-separator />
      <lf-dropdown-item
        type="danger"
        class="w-full"
        @click="removeIdentity"
      >
        <lf-icon name="delete-bin-6-line" />Delete identity
      </lf-dropdown-item>
    </lf-dropdown>
  </article>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import Message from '@/shared/message/message';
import LfSvg from '@/shared/svg/svg.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { computed, ref } from 'vue';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';
import { useOrganizationStore } from '@/modules/organization/store/pinia';

const props = defineProps<{
  identity: OrganizationIdentity,
  organization: Organization
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void }>();

const { hasPermission } = usePermissions();

const { updateOrganization } = useOrganizationStore();

const hovered = ref(false);

const platform = (name: string) => CrowdIntegrations.getConfig(name);

const isVerifyDisabled = computed(
  () => !!props.identity.sourceId || ['integration', 'lfid'].includes(props.identity.platform),
);

const verifyIdentity = (verified: boolean) => {
  const identities = props.organization.identities.map((i: OrganizationIdentity) => {
    if (i.platform === props.identity?.platform && i.value === props.identity?.value) {
      return {
        ...i,
        verified,
      };
    }
    return i;
  });

  updateOrganization(props.organization.id, {
    identities,
  })
    .then(() => {
      Message.success('Identity updated successfully');
    })
    .catch(() => {
      Message.error('Something went wrong while updating an identity');
    });
};

const removeIdentity = () => {
  const identities = props.organization.identities
    .filter((i: OrganizationIdentity) => !(i.platform === props.identity?.platform && i.value === props.identity?.value));

  updateOrganization(props.organization.id, {
    identities,
  })
    .then(() => {
      Message.success('Identity deleted successfully');
    })
    .catch(() => {
      Message.error('Something went wrong while deleting an identity');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsIdentityItem',
};
</script>
