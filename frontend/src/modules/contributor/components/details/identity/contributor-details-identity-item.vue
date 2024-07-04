<template>
  <article
    class="flex"
  >
    <lf-tooltip v-if="props.identity.type === 'email'" content="Email" placement="top-start">
      <lf-icon name="mail-line" :size="20" />
    </lf-tooltip>
    <lf-tooltip v-else-if="platform(props.identity.platform)" placement="top-start" :content="platform(props.identity.platform).name">
      <img
        :src="platform(props.identity.platform)?.image"
        class="h-5 w-5"
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
          <p v-if="!platform(props.identity.platform)" class="text-medium text-gray-400 ml-1">
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
    <lf-dropdown placement="bottom-end" width="232px">
      <template #trigger>
        <lf-button type="secondary-ghost" size="small" :icon-only="true">
          <lf-icon name="more-fill" />
        </lf-button>
      </template>
      <!-- Edit identity -->
      <lf-dropdown-item @click="emit('edit')">
        <lf-icon name="pencil-line" />Edit identity
      </lf-dropdown-item>
      <lf-dropdown-separator />
      <!-- Verified -->
      <lf-dropdown-item v-if="props.identity.verified" @click="verifyIdentity(false)">
        <lf-svg name="unverify" class="!h-4 !w-4 text-gray-600" />Unverify identity
      </lf-dropdown-item>
      <lf-dropdown-item v-else @click="verifyIdentity(true)">
        <lf-icon name="verified-badge-line" />Verify identity
      </lf-dropdown-item>
      <lf-dropdown-item @click="emit('unmerge')">
        <lf-icon name="link-unlink" />Unmerge identity
      </lf-dropdown-item>

      <lf-dropdown-separator />
      <lf-dropdown-item type="danger">
        <lf-icon name="delete-bin-6-line" />Delete identity
      </lf-dropdown-item>
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

const props = defineProps<{
  identity: ContributorIdentity,
  contributor: Contributor
}>();

const emit = defineEmits<{(e: 'edit'): void, (e: 'unmerge'): void }>();

const { updateContributor } = useContributorStore();

const platform = (name: string) => CrowdIntegrations.getConfig(name);

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
