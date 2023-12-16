<template>
  <div class="member-view-header panel relative">
    <div class="flex items-start gap-4">
      <app-avatar :entity="member" size="xl" />
      <div class="flex grow flex-col gap-2">
        <div class="flex justify-between items-center">
          <div class="flex items-center h-fit">
            <h5 v-html="$sanitize(member.displayName)" />
            <app-member-badge :member="member" class="ml-2" />
          </div>
          <div class="flex items-center gap-4">
            <app-member-sentiment :member="member" />
            <app-member-engagement-level :member="member" />
            <app-member-dropdown
              :member="member"
              :show-view-member="false"
              @merge="isMergeDialogOpen = member"
              @find-github="isFindGithubDrawerOpen = member"
            />
          </div>
        </div>
        <app-member-organizations
          class="mt-2"
          :member="member"
          orientation="horizontal"
        />
      </div>
    </div>
    <div class="text-sm text-gray-600 py-6 border-b border-gray-200 mb-4">
      <app-member-bio :member="member" />
    </div>
    <div class="grid grid-rows-2 grid-flow-col gap-4">
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          # of activities
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{ formattedInformation(member.activityCount, 'number') }}
        </p>
      </div>
      <div>
        <div class="flex items-center">
          <p class="text-gray-400 font-medium text-2xs mr-2">
            Location
          </p>
          <el-tooltip
            v-if="getAttributeSourceName(member.attributes.location)"
            :content="`Source: ${getAttributeSourceName(member.attributes.location)}`"
            placement="top"
            trigger="hover"
          >
            <app-svg name="source" class="h-3 w-3" />
          </el-tooltip>
        </div>

        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(member.attributes.location?.default, 'string')
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Contributor since
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{ formattedInformation(member.joinedAt, 'date') }}
        </p>
      </div>
      <div>
        <div class="flex items-center gap-1">
          <p class="text-gray-400 font-medium text-2xs">
            Reach
          </p>
          <el-tooltip placement="top">
            <template #content>
              Reach is the combined followers across social platforms (e.g. GitHub or Twitter).
            </template>
            <i class="ri-information-line text-gray-500 text-xs mr-1" />
          </el-tooltip>
          <el-tooltip
            content="Source: GitHub"
            placement="top"
            trigger="hover"
          >
            <app-svg name="source" class="h-3 w-3" />
          </el-tooltip>
        </div>

        <p class="mt-1 text-gray-900 text-xs">
          <app-member-reach :member="member" />
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Last active
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{ formattedInformation(member.lastActivity?.timestamp, 'relative') }}
        </p>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-0 rounded-b-md bg-gray-50 p-6 mt-9">
      <div class="text-sm">
        <app-tags :long="true" :member="member" @edit="isEditTagsDialogOpen = true" />
        <app-tag-popover v-model="isEditTagsDialogOpen" :member="member" />
      </div>
    </div>
    <app-member-find-github-drawer
      v-if="isFindGithubDrawerOpen"
      v-model="isFindGithubDrawerOpen"
    />
    <app-member-merge-dialog v-model="isMergeDialogOpen" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import moment from 'moment/moment';
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue';
import { formatNumberToCompact, formatNumber } from '@/utils/number';
import { formatDateToTimeAgo, formatDate } from '@/utils/date';
import AppMemberReach from '@/modules/member/components/member-reach.vue';
import AppMemberSentiment from '@/modules/member/components/member-sentiment.vue';
import AppMemberEngagementLevel from '@/modules/member/components/member-engagement-level.vue';
import AppMemberDropdown from '@/modules/member/components/member-dropdown.vue';
import AppMemberBadge from '@/modules/member/components/member-badge.vue';
import AppTags from '@/modules/tag/components/tag-list.vue';
import AppMemberBio from '@/modules/member/components/member-bio.vue';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';
import AppMemberMergeDialog from '@/modules/member/components/member-merge-dialog.vue';
import AppMemberFindGithubDrawer from '@/modules/member/components/member-find-github-drawer.vue';
import AppSvg from '@/shared/svg/svg.vue';
import { getAttributeSourceName } from '@/shared/helpers/attribute.helpers';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const isEditTagsDialogOpen = ref(false);
const isMergeDialogOpen = ref(null);
const isFindGithubDrawerOpen = ref(null);

const formattedInformation = (value, type) => {
  // Show dash for empty information
  if (
    value === undefined
    || value === null
    || value === -1
    // If the timestamp is 1970, we show "-"
    || (type === 'date' && moment(value).isBefore(moment().subtract(40, 'years')))
  ) {
    return '-';
  }

  // Render inforamation depending on type
  if (type === 'date') {
    return formatDate({ timestamp: value });
  }
  if (type === 'number') {
    return formatNumber(value);
  }
  if (type === 'relative') {
    return formatDateToTimeAgo(value);
  }
  if (type === 'compact') {
    return formatNumberToCompact(value);
  }

  return value;
};
</script>

<script>
export default {
  name: 'AppMemberViewHeader',
};
</script>

<style lang="scss">
.member-view-header.panel {
  @apply pb-24;
}
</style>
