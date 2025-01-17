<template>
  <article
    class="flex items-start contributor-identity-item"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="mt-0.5">
      <lf-tooltip v-if="props.identity.type === 'email'" content="Email" placement="top-start">
        <lf-icon name="envelope" type="regular" :size="20" />
      </lf-tooltip>
      <lf-tooltip v-else-if="platform(props.identity.platform)" placement="top-start" :content="platform(props.identity.platform).name">
        <img
          :src="platform(props.identity.platform)?.image"
          class="h-5 w-5 object-contain"
          :alt="props.identity.value"
        />
      </lf-tooltip>
      <lf-tooltip v-else content="Custom identity" placement="top-start">
        <lf-icon
          name="fingerprint"
          :size="20"
          class="text-gray-600"
        />
      </lf-tooltip>
    </div>

    <div class="pl-3 flex-grow">
      <div class="flex items-center">
        <div class=" flex items-center">
          <p v-if="!props.identity.url" class="text-medium max-w-48 truncate">
            {{ props.identity.value }}
          </p>
          <a
            v-else
            :href="props.identity.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 max-w-48 truncate"
          >
            {{ props.identity.value }}
          </a>
          <p
            v-if="!platform(props.identity.platform) && !props.identity.platforms
              && CrowdIntegrations.getPlatformsLabel([props.identity.platform]).length > 0"
            class="text-medium text-gray-400 ml-1"
          >
            <span v-html="$sanitize(CrowdIntegrations.getPlatformsLabel([props.identity.platform]))" />
          </p>
        </div>
        <lf-verified-identity-badge v-if="props.identity.verified" />
      </div>
      <p
        v-if="props.identity.platforms && CrowdIntegrations.getPlatformsLabel(props.identity.platforms).length > 0"
        class="text-tiny text-gray-400 pt-1.5"
      >
        Source: <span v-html="$sanitize(CrowdIntegrations.getPlatformsLabel(props.identity.platforms))" />
      </p>
    </div>

    <!-- Dropdown -->
    <lf-dropdown v-show="hovered" placement="bottom-end" width="232px">
      <template #trigger>
        <lf-button type="secondary-ghost" size="small" :icon-only="true">
          <lf-icon name="ellipsis" />
        </lf-button>
      </template>
      <!-- Edit identity -->
      <lf-tooltip
        v-if="hasPermission(LfPermission.memberEdit)"
        placement="top"
        :disabled="!editingDisabled"
        class="!w-full"
      >
        <template #content>
          Identity can't be edited because the <br>contributor is active on
          {{ platform(props.identity.platform)?.name || props.identity.platform }}
        </template>
        <lf-dropdown-item
          :disabled="editingDisabled"
          class="w-full"
          @click="emit('edit')"
        >
          <lf-icon name="pen fa-sharp" />Edit identity
        </lf-dropdown-item>
      </lf-tooltip>

      <!-- Unmerge -->
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.memberEdit)"
        @click="emit('unmerge')"
      >
        <lf-icon name="link-simple-slash" />Unmerge identity
      </lf-dropdown-item>

      <lf-dropdown-item
        @click="setReportDataModal({
          contributor: props.contributor,
          type: ReportDataType.IDENTITY,
          attribute: props.identity,
        })"
      >
        <lf-icon name="message-exclamation fa-sharp" class="!text-red-500" />Report issue
      </lf-dropdown-item>

      <template
        v-if="hasPermission(LfPermission.memberEdit)"
      >
        <lf-dropdown-separator />
        <lf-tooltip
          placement="top"
          :disabled="!editingDisabled"
          class="!w-full"
        >
          <template #content>
            Identity can't be deleted because the <br>contributor is active on
            {{ platform(props.identity.platform)?.name || props.identity.platform }}
          </template>
          <lf-dropdown-item
            type="danger"
            :disabled="editingDisabled"
            class="w-full"
            @click="removeIdentity"
          >
            <lf-icon name="trash-can" />Delete identity
          </lf-dropdown-item>
        </lf-tooltip>
      </template>
    </lf-dropdown>
  </article>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import Message from '@/shared/message/message';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { computed, ref } from 'vue';
import LfVerifiedIdentityBadge from '@/shared/modules/identities/components/verified-identity-badge.vue';
import { ReportDataType } from '@/shared/modules/report-issue/constants/report-data-type.enum';
import { useSharedStore } from '@/shared/pinia/shared.store';

const props = defineProps<{
  identity: ContributorIdentity,
  contributor: Contributor
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void }>();

const { hasPermission } = usePermissions();
const { setReportDataModal } = useSharedStore();

const { deleteContributorIdentity } = useContributorStore();

const hovered = ref(false);

const platform = (name: string) => CrowdIntegrations.getConfig(name);

const editingDisabled = computed(() => {
  if (['git'].includes(props.identity.platform)) {
    return false;
  }
  return props.contributor
    ? props.contributor.activeOn?.includes(props.identity.platform)
    : false;
});

const removeIdentity = () => {
  deleteContributorIdentity(props.contributor.id, props.identity.id)
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
  name: 'LfContributorDetailsIdentityItem',
};
</script>
