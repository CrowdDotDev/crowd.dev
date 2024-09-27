<template>
  <article
    class="flex items-start justify-between w-full"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="flex items-start">
      <lf-icon name="mail-line" :size="20" class="text-gray-500" />
      <div class="pl-2">
        <div class="flex items-center">
          <lf-tooltip
            :content="props.email.value"
            :disabled="props.email.value.length < 25"
          >
            <a
              :href="`mailto:${props.email.value}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 truncate"
              style="max-width: 25ch"
            >
              {{ props.email.value }}
            </a>
          </lf-tooltip>
          <lf-tooltip v-if="props.email.verified" content="Verified email">
            <lf-icon
              name="verified-badge-line"
              :size="16"
              class="ml-1 text-primary-500"
            />
          </lf-tooltip>
        </div>

        <p v-if="platformLabel(props.email.platforms).length > 0" class="mt-1.5 text-tiny text-gray-400">
          Source: <span v-html="$sanitize(platformLabel(props.email.platforms))" />
        </p>
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
        <lf-icon name="pencil-line" />Edit email
      </lf-dropdown-item>

      <!-- Unmerge -->
      <lf-dropdown-item @click="emit('unmerge')">
        <lf-icon name="link-unlink" />Unmerge email
      </lf-dropdown-item>

      <lf-dropdown-separator />
      <lf-dropdown-item
        type="danger"
        class="w-full"
        @click="removeEmail"
      >
        <lf-icon name="delete-bin-6-line" />Delete email
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
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { ref } from 'vue';
import {
  Organization,
  OrganizationIdentity,
  OrganizationIdentityType,
} from '@/modules/organization/types/Organization';
import { useOrganizationStore } from '@/modules/organization/store/pinia';

const props = defineProps<{
  email: OrganizationIdentity,
  organization: Organization
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void }>();

const { hasPermission } = usePermissions();

const { updateOrganization } = useOrganizationStore();

const hovered = ref(false);

const platformLabel = (platforms: string[]) => CrowdIntegrations.getPlatformsLabel(platforms);
const removeEmail = () => {
  const identities = props.organization.identities
    .filter((i: OrganizationIdentity) => !(i.type === OrganizationIdentityType.EMAIL && i.value === props.email?.value));

  updateOrganization(props.organization.id, {
    identities,
  })
    .then(() => {
      Message.success('Email deleted successfully');
    })
    .catch(() => {
      Message.error('Something went wrong while deleting an email');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsEmailItem',
};
</script>
