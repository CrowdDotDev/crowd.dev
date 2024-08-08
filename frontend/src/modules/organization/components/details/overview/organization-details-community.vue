<template>
  <section>
    <lf-card class="!bg-gradient-to-b from-primary-25 to-white px-5 pt-5 pb-6">
      <h6 class="text-h6 mb-4">
        Community snapshot
      </h6>
      <div class="flex flex-wrap gap-y-4 -mx-4">
        <article class="px-4 h-full w-1/2 xl:w-1/3">
          <p class="text-tiny text-secondary-300 mb-2">
            Community size
          </p>
          <p v-if="!loadingMemberCount" class="text-small text-gray-600">
            {{ pluralize('person', memberCount || 0, true) }}
          </p>
        </article>
        <article class="px-4 h-full w-1/2 xl:w-1/3 border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            # of activities
          </p>
          <lf-loading
            v-if="props.organization.activitySycning?.state === MergeActionState.IN_PROGRESS"
            :count="1"
            height="1rem"
            width="4rem"
            class="rounded"
          />
          <p v-else class="text-small text-gray-600">
            {{ props.organization.activityCount && formatNumber(props.organization.activityCount) || '-' }}
          </p>
        </article>
        <article class="px-4 h-full w-1/2 xl:w-1/3 xl:border-l border-gray-200">
          <p class="text-tiny text-secondary-300 mb-2">
            Joined date
          </p>
          <p class="text-small text-gray-600">
            {{ moment(props.organization.joinedAt).isAfter(moment('1970-01-01', 'year'))
              ? moment(props.organization.joinedAt).format('MMM DD, YYYY') : '-' }}
          </p>
        </article>
      </div>
    </lf-card>
  </section>
</template>

<script setup lang="ts">
import LfCard from '@/ui-kit/card/Card.vue';
import moment from 'moment';
import { formatNumber } from '@/utils/number';
import { Organization } from '@/modules/organization/types/Organization';
import pluralize from 'pluralize';
import { onMounted, ref } from 'vue';
import { MemberService } from '@/modules/member/member-service';
import { MergeActionState } from '@/shared/modules/merge/types/MemberActions';
import LfLoading from '@/ui-kit/loading/Loading.vue';

const props = defineProps<{
  organization: Organization,
}>();

const memberCount = ref<number>(0);
const loadingMemberCount = ref<boolean>(true);
const orgFilter = { organizations: { contains: [props.organization.id] } };

const doGetMembersCount = () => {
  loadingMemberCount.value = true;
  MemberService.listMembers(
    {
      limit: 1,
      offset: 0,
      filter: orgFilter,
    },
    true,
  )
    .then(({ count }) => {
      memberCount.value = count;
    })
    .finally(() => {
      loadingMemberCount.value = false;
    });
};

onMounted(() => {
  doGetMembersCount();
});
</script>
<script lang="ts">
export default {
  name: 'LfOrganizationDetailsCommunity',
};
</script>
