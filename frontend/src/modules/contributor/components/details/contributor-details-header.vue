<template>
  <div class="flex items-center">
    <lf-tooltip
      :content="`Joined on ${moment(props.contributor.joinedAt).format('MMM DD, YYYY')}`"
      :disabled="!isNew(props.contributor)"
    >
      <lf-avatar
        :size="48"
        :name="props.contributor.displayName"
        :src="avatar(props.contributor)"
      />
      <div
        v-if="isNew(props.contributor)"
        class="absolute -top-1.5 left-1/2 border-2 border-white bg-primary-500
      text-xtiny rounded-md px-0.5 text-white font-semibold transform -translate-x-1/2 "
      >
        New
      </div>
    </lf-tooltip>
    <div class="pl-3">
      <h5 class="mb-1 max-w-80 truncate">
        {{ props.contributor.displayName }}
      </h5>
      <div class="flex items-center gap-1.5">
        <lf-badge v-if="isTeamContributor(props.contributor)" size="small">
          Team
        </lf-badge>
        <lf-badge v-if="isBot(props.contributor)" type="tertiary" size="small">
          Bot
        </lf-badge>
        <p v-if="isBot(props.contributor) || isTeamContributor(props.contributor)" class="text-small text-gray-400">
          •
        </p>
        <lf-contributor-work-position :contributor="props.contributor" />
        <p v-if="hasHeaderIdentities && (organization || jobTitle)" class="text-small text-gray-400">
          •
        </p>
        <lf-contributor-details-header-profiles
          :contributor="props.contributor"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import moment from 'moment';
import LfBadge from '@/ui-kit/badge/Badge.vue';
import LfContributorWorkPosition from '@/modules/contributor/components/shared/contributor-work-position.vue';
import LfContributorDetailsHeaderProfiles
  from '@/modules/contributor/components/details/header/contributor-details-header-profiles.vue';
import { computed } from 'vue';
import { detailsHeaderProfilePlatforms } from '@/modules/contributor/config/details-header-profile-platforms';

const props = defineProps<{
  contributor: Contributor,
}>();

const {
  avatar, isNew, isBot, isTeamContributor, activeOrganization,
} = useContributorHelpers();

const hasHeaderIdentities = computed(() => props.contributor.identities.some((i) => detailsHeaderProfilePlatforms.includes(i.platform)));

const organization = computed(() => activeOrganization(props.contributor));
const jobTitle = computed(() => props.contributor.attributes.jobTitle?.default
    || organization.value?.memberOrganizations?.title);
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsHeader',
};
</script>
