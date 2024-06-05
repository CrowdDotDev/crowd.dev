<template>
  <section>
    <lf-card class="!bg-gradient-to-b from-primary-25 to-white px-5 pt-5 pb-6">
      <h6 class="text-h6 mb-4">
        Community snapshot
      </h6>
      <div class="flex -mx-4">
        <article class="px-4 h-full w-1/4">
          <div class="flex items-center gap-1 mb-2">
            <p class="text-tiny text-secondary-300">
              Engagement level
            </p>
            <lf-tooltip
              content="Calculated based on the recency and importance of a contributor's
activities in comparison to all other contributors."
            >
              <lf-icon name="question-line" :size="14" class="text-secondary-200" />
            </lf-tooltip>
          </div>
          <lf-contributor-engagement-level :contributor="{ score: 5 }" />
        </article>
        <article class="px-4 h-full w-1/4 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            Avg. sentiment
          </p>
          <lf-contributor-sentiment :contributor="props.contributor" />
        </article>
        <article class="px-4 h-full w-1/4 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            # of activities
          </p>
          <p class="text-small">
            {{ props.contributor.activityCount || '-' }}
          </p>
        </article>
        <article class="px-4 h-full w-1/4 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            Joined date
          </p>
          <p class="text-small">
            {{ moment(props.contributor.joinedAt).format('MMM DD, YYYY') }}
          </p>
        </article>
      </div>
    </lf-card>
  </section>
</template>

<script setup lang="ts">
import LfCard from '@/ui-kit/card/Card.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import moment from 'moment';
import LfContributorSentiment from '@/modules/contributor/components/shared/contributor-sentiment.vue';
import LfContributorEngagementLevel from '@/modules/contributor/components/shared/contributor-engagement-level.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>
<script lang="ts">
export default {
  name: 'LfContributorDetailsCommunity',
};
</script>
