<template>
  <article
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="flex items-center justify-between min-h-7">
      <div class="flex items-center">
        <lf-icon name="link" :size="20" class="text-gray-500 mr-2" />
        <lf-tooltip
          :content="props.domain.value"
          :disabled="props.domain.value.length < 25"
        >
          <a
            :href="withHttp(props.domain.value)"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 truncate"
            style="max-width: 25ch"
          >
            {{ props.domain.value }}
          </a>
        </lf-tooltip>
        <lf-tooltip v-if="props.domain.verified" content="Verified domain" class="ml-1.5">
          <lf-icon name="verified-badge-line" :size="16" class="text-primary-500" />
        </lf-tooltip>
      </div>
      <lf-dropdown
        v-if="props.domain.type !== OrganizationIdentityType.AFFILIATED_PROFILE
          && hovered && hasPermission(LfPermission.memberEdit)"
        placement="bottom-end"
        width="232px"
      >
        <template #trigger>
          <lf-button type="secondary-ghost" size="small" :icon-only="true">
            <lf-icon name="more-fill" />
          </lf-button>
        </template>

        <lf-dropdown-item
          class="w-full"
          @click="emit('edit')"
        >
          <lf-icon name="pencil-line" />Edit domain
        </lf-dropdown-item>

        <!-- Unmerge -->
        <lf-dropdown-item @click="emit('unmerge')">
          <lf-icon name="link-unlink" />Unmerge domain
        </lf-dropdown-item>

        <lf-dropdown-separator />
        <lf-dropdown-item
          type="danger"
          class="w-full"
          @click="removeDomain()"
        >
          <lf-icon name="delete-bin-6-line" />Delete domain
        </lf-dropdown-item>
      </lf-dropdown>
    </div>

    <div v-if="platformLabel(props.domain.platforms).length" class="pl-7">
      <p class="text-tiny text-gray-400">
        Source: <span v-html="$sanitize(platformLabel(props.domain.platforms))" />
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  Organization,
  OrganizationIdentity,
  OrganizationIdentityType,
} from '@/modules/organization/types/Organization';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { withHttp } from '@/utils/string';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { ref } from 'vue';
import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';

const props = defineProps<{
  domain: OrganizationIdentity,
  organization: Organization,
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void, }>();
const platformLabel = (platforms: string[]) => CrowdIntegrations.getPlatformsLabel(platforms);

const { hasPermission } = usePermissions();
const { updateOrganization } = useOrganizationStore();

const hovered = ref(false);

const removeDomain = () => {
  const identities = props.organization.identities
    .filter((i: OrganizationIdentity) => !(i.platform === props.domain?.platform
        && i.value === props.domain?.value
        && i.type === props.domain?.type));

  updateOrganization(props.organization.id, {
    identities,
  })
    .then(() => {
      Message.success('Domain deleted successfully');
    })
    .catch(() => {
      Message.error('Something went wrong while deleting a domain');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsDomainItem',
};
</script>
