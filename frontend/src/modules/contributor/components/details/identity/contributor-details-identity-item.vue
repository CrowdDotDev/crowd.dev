<template>
  <article
    class="flex items-start"
  >
    <div class="mt-0.5">
      <lf-tooltip v-if="props.identity.type === 'email'" content="Email" placement="top-start">
        <lf-icon name="mail-line" :size="20" />
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
          <p v-if="!platform(props.identity.platform) && !props.identity.platforms" class="text-medium text-gray-400 ml-1">
            {{ props.identity.platform }}
          </p>
        </div>
        <lf-tooltip v-if="props.identity.verified" content="Verified identity">
          <lf-icon
            name="verified-badge-line"
            :size="16"
            class="ml-1 text-primary-500"
          />
        </lf-tooltip>
      </div>
      <p v-if="props.identity.platforms && CrowdIntegrations.getPlatformsLabel(props.identity.platforms)" class="text-tiny text-gray-400 pt-1.5">
        Source: {{ CrowdIntegrations.getPlatformsLabel(props.identity.platforms) }}
      </p>
    </div>

    <!-- Dropdown -->
    <lf-dropdown v-if="hasPermission(LfPermission.memberEdit)" placement="bottom-end" width="232px">
      <template #trigger>
        <lf-button type="secondary-ghost" size="small" :icon-only="true">
          <lf-icon name="more-fill" />
        </lf-button>
      </template>
      <!-- Edit identity -->
      <el-tooltip
        placement="top"
        :disabled="!editingDisabled"
        :content="`Identity can't be edited because the contributor is active on
        ${platform(props.identity.platform)?.name || props.identity.platform}`"
      >
        <lf-dropdown-item
          :disabled="editingDisabled"
          @click="emit('edit')"
        >
          <lf-icon name="pencil-line" />Edit identity
        </lf-dropdown-item>
      </el-tooltip>

      <lf-dropdown-separator />

      <!-- Verified -->
      <el-tooltip
        v-if="props.identity.verified"
        placement="top"
        content="Identities tracked from Integrations can’t be unverified"
        :disabled="!isVerifyDisabled"
      >
        <lf-dropdown-item
          v-if="props.identity.verified"
          placement="top"
          :disabled="isVerifyDisabled"
          @click="verifyIdentity(false)"
        >
          <lf-svg name="unverify" class="!h-4 !w-4 text-gray-600" />Unverify identity
        </lf-dropdown-item>
      </el-tooltip>
      <el-tooltip
        v-else
        placement="top"
        content="Identities tracked from Integrations can’t be verified"
        :disabled="!isVerifyDisabled"
      >
        <lf-dropdown-item
          :disabled="isVerifyDisabled"
          @click="verifyIdentity(true)"
        >
          <lf-icon name="verified-badge-line" />Verify identity
        </lf-dropdown-item>
      </el-tooltip>

      <!-- Unmerge -->
      <lf-dropdown-item @click="emit('unmerge')">
        <lf-icon name="link-unlink" />Unmerge identity
      </lf-dropdown-item>

      <lf-dropdown-separator />
      <el-tooltip
        placement="top"
        :disabled="!editingDisabled"
        :content="`Identity can't be deleted because the contributor is active on
        ${platform(props.identity.platform)?.name || props.identity.platform}`"
      >
        <lf-dropdown-item
          type="danger"
          :disabled="editingDisabled"
          @click="removeIdentity"
        >
          <lf-icon name="delete-bin-6-line" />Delete identity
        </lf-dropdown-item>
      </el-tooltip>
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
import LfSvg from '@/shared/svg/svg.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { computed } from 'vue';

const props = defineProps<{
  identity: ContributorIdentity,
  contributor: Contributor
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void }>();

const { hasPermission } = usePermissions();

const { updateContributor } = useContributorStore();

const platform = (name: string) => CrowdIntegrations.getConfig(name);

const isVerifyDisabled = computed(
  () => !!props.identity.sourceId || ['integration', 'lfid'].includes(props.identity.platform),
);

const editingDisabled = computed(() => {
  if (['git'].includes(props.identity.platform)) {
    return false;
  }
  return props.contributor
    ? props.contributor.activeOn?.includes(props.identity.platform)
    : false;
});

const verifyIdentity = (verified: boolean) => {
  const identities = props.contributor.identities.map((i: ContributorIdentity) => {
    if (i.platform === props.identity?.platform && i.value === props.identity?.value) {
      return {
        ...i,
        verified,
      };
    }
    return i;
  });

  updateContributor(props.contributor.id, {
    identities,
  })
    .catch(() => {
      Message.error('Something went wrong while updating an identity');
    })
    .then(() => {
      Message.success('Identity updated successfully');
    });
};

const removeIdentity = () => {
  const identities = props.contributor.identities
    .filter((i: ContributorIdentity) => !(i.platform === props.identity?.platform && i.value === props.identity?.value));

  updateContributor(props.contributor.id, {
    identities,
  })
    .catch(() => {
      Message.error('Something went wrong while deleting an identity');
    })
    .then(() => {
      Message.success('Identity updated successfully');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentityItem',
};
</script>
