<template>
  <article class="border-b border-gray-100 py-5">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <lf-avatar
          :src="avatar(props.member)"
          :name="props.member.displayName"
          :size="32"
        />
        <p class="text-medium font-semibold">
          {{ props.member.displayName }}
        </p>
        <lf-badge size="small" :type="config.badgeType" class="!font-semibold">
          {{ config.badgeText(props.member) }}
        </lf-badge>
      </div>
      <slot name="action" />
    </div>
    <p class="text-small mt-2 text-gray-500" v-html="$sanitize(config.description(props.member))" />
  </article>
</template>

<script lang="ts" setup>
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import LfBadge from '@/ui-kit/badge/Badge.vue';
import { computed } from 'vue';
import { DataIssueTypeConfig, dataIssueTypes } from '@/modules/data-quality/config/data-issue-types';

const props = defineProps<{
  member: Contributor,
  type: SelectedIssueType,
}>();

const { avatar } = useContributorHelpers();

const config = computed<DataIssueTypeConfig>(() => dataIssueTypes[props.type]);
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMemberIssuesItem',
};
</script>
