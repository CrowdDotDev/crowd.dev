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
        <lf-icon-old
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
            {{ props.identity.handle || props.identity.value }}
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
        <lf-verified-identity-badge v-if="props.identity.verified" />
      </div>
    </div>

    <!-- Dropdown -->
    <lf-dropdown v-if="hovered" placement="bottom-end" width="232px">
      <template #trigger>
        <lf-button type="secondary-ghost" size="small" :icon-only="true">
          <lf-icon-old name="more-fill" />
        </lf-button>
      </template>
      <!-- Edit identity -->
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.organizationEdit)"
        class="w-full"
        @click="emit('edit')"
      >
        <lf-icon-old name="pencil-line" />Edit identity
      </lf-dropdown-item>

      <!-- Unmerge -->
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.organizationEdit)"
        @click="emit('unmerge')"
      >
        <lf-icon-old name="link-unlink" />Unmerge identity
      </lf-dropdown-item>

      <lf-dropdown-item
        @click="setReportDataModal({
          organization: props.organization,
          type: ReportDataType.IDENTITY,
          attribute: props.identity,
        })"
      >
        <lf-icon name="feedback-line" class="!text-red-500" />Report issue
      </lf-dropdown-item>

      <lf-dropdown-separator
        v-if="hasPermission(LfPermission.organizationEdit)"
      />
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.organizationEdit)"
        type="danger"
        class="w-full"
        @click="removeIdentity"
      >
        <lf-icon-old name="delete-bin-6-line" />Delete identity
      </lf-dropdown-item>
    </lf-dropdown>
  </article>
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import Message from '@/shared/message/message';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { ref } from 'vue';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import LfVerifiedIdentityBadge from '@/shared/modules/identities/components/verified-identity-badge.vue';
import { useSharedStore } from '@/shared/pinia/shared.store';
import { ReportDataType } from '@/shared/modules/report-issue/constants/report-data-type.enum';

const props = defineProps<{
  identity: OrganizationIdentity,
  organization: Organization
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void }>();

const { hasPermission } = usePermissions();
const { setReportDataModal } = useSharedStore();

const { updateOrganization } = useOrganizationStore();

const hovered = ref(false);

const platform = (name: string) => CrowdIntegrations.getConfig(name);

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
