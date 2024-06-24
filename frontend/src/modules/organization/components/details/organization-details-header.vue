<template>
  <div class="flex items-center">
    <div class="relative">
      <lf-avatar
        :size="48"
        :name="props.organization.displayName"
        :src="props.organization.logo"
        class="!rounded-md border border-gray-300"
        img-class="!object-contain"
      >
        <template #placeholder>
          <div class="w-full h-full bg-gray-50 flex items-center justify-center">
            <lf-icon name="community-line" :size="32" class="text-gray-300" />
          </div>
        </template>
      </lf-avatar>
      <div
        v-if="isNew(props.organization)"
        class="absolute -top-1.5 left-1/2 border-2 border-white bg-primary-500
      text-xtiny rounded-md px-0.5 text-white font-semibold transform -translate-x-1/2 "
      >
        New
      </div>
    </div>

    <div class="pl-3">
      <h5 class="mb-1 truncate" style="max-width: 30ch">
        {{ props.organization.displayName }}
      </h5>
      <div class="flex items-center gap-1.5">
        <lf-organization-membership :organization="props.organization" />
        <p v-if="!!props.organization.lfxMembership" class="text-small text-gray-400">
          •
        </p>
        <template v-if="props.organization.isTeamOrganization">
          <lf-badge size="small">
            Team
          </lf-badge>
          <p v-if="props.organization.isTeamOrganization" class="text-small text-gray-400">
            •
          </p>
        </template>
        <a
          v-if="!!websiteCom"
          :href="withHttp(websiteCom.value)"
          class="flex items-center gap-1 group"
          target="_blank"
          rel="noopener noreferrer"
        >
          <lf-icon name="link" :size="16" class="text-gray-400" />
          <div class="text-gray-500 text-small truncate group-hover:text-primary-500" style="max-width: 20ch">
            {{ websiteCom.value }}
          </div>
        </a>
        <p v-if="hasHeaderIdentities && !!websiteCom" class="text-small text-gray-400">
          •
        </p>
        <lf-organization-details-header-profiles :organization="props.organization" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfBadge from '@/ui-kit/badge/Badge.vue';
import { Organization } from '@/modules/organization/types/Organization';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import LfOrganizationMembership from '@/modules/organization/components/shared/organization-membership.vue';
import { withHttp } from '@/utils/string';
import LfOrganizationDetailsHeaderProfiles
  from '@/modules/organization/components/details/header/organization-details-header-profiles.vue';
import { computed } from 'vue';
import {
  organizationDetailsHeaderProfilePlatforms,
} from '@/modules/organization/config/details-header-profile-platforms';

const props = defineProps<{
  organization: Organization,
}>();

const { isNew, website } = useOrganizationHelpers();

const websiteCom = computed(() => website(props.organization));

const hasHeaderIdentities = computed(() => props.organization.identities.some((i) => organizationDetailsHeaderProfilePlatforms.includes(i.platform)));
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsHeader',
};
</script>
