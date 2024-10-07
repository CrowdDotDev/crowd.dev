<template>
  <div v-if="loading || !contributor" class="flex justify-center py-20">
    <lf-spinner />
  </div>
  <div v-else class="-mt-5 -mb-5">
    <div class="contributor-details  grid grid-cols-2 grid-rows-2 px-3">
      <section
        class="w-full border-b border-gray-100 py-4 flex justify-between items-center col-span-2 h-min"
        :class="hovered ? 'is-hovered' : ''"
        @mouseover="hovered = true"
        @mouseout="hovered = false"
      >
        <div class="flex items-center">
          <lf-back :to="{ path: '/people' }" class="mr-2" @mouseover.stop @mouseout.stop>
            <lf-button type="secondary-ghost" :icon-only="true">
              <lf-icon-old name="arrow-left-s-line" />
            </lf-button>
          </lf-back>
          <lf-contributor-details-header :contributor="contributor" />
        </div>
        <div class="flex items-center">
          <lf-contributor-syncing-activities v-if="contributor.activitySycning?.state === MergeActionState.IN_PROGRESS" :contributor="contributor" />
          <lf-contributor-last-enrichment v-else :contributor="contributor" class="mr-4" />
          <div @mouseover.stop @mouseout.stop>
            <lf-contributor-details-actions :contributor="contributor" @reload="fetchContributor()" />
          </div>
        </div>
      </section>
      <section class="w-80 border-r relative border-gray-100 overflow-y-auto overflow-x-visible h-full ">
        <div class="sticky top-0 left-0 w-full h-6 bg-gradient-to-b from-white to-transparent" />
        <div class="pr-8 pb-10">
          <lf-contributor-details-work-history
            :contributor="contributor"
            class="mb-8"
            @reload="fetchContributor()"
          />
          <lf-contributor-details-identities
            :contributor="contributor"
            class="mb-8"
            @reload="fetchContributor()"
          />
        </div>
      </section>
      <section class="overflow-auto h-full pb-10" @scroll="controlScroll">
        <div class="sticky top-0 z-10">
          <div class="bg-white pt-5 pl-10 pb-3">
            <lf-tabs v-model="tabs">
              <lf-tab v-model="tabs" name="overview">
                Overview
              </lf-tab>
              <lf-tab v-model="tabs" name="activities">
                <div class="flex items-center gap-1">
                  Activities
                  <lf-icon-old
                    v-if="contributor.activitySycning?.state === MergeActionState.ERROR"
                    name="error-warning-line"
                    :size="16"
                    class="text-red-500"
                  />
                </div>
              </lf-tab>
              <lf-tab v-model="tabs" name="notes">
                Notes
              </lf-tab>
            </lf-tabs>
          </div>
          <div class="w-full h-5 bg-gradient-to-b from-white to-transparent pl-10" />
        </div>
        <div class="pl-10">
          <div
            v-if="isMasked(contributor) && tabs === 'overview'"
            class="flex items-center bg-yellow-50 p-2 mb-6 text-small rounded-md border border-yellow-300 text-yellow-600"
          >
            <lf-icon-old name="error-warning-line" class="mr-2" /> This person's data is not shown because of the GDPR.
          </div>
          <lf-contributor-details-overview
            v-if="tabs === 'overview'"
            :contributor="contributor"
          />
          <lf-contributor-details-activities
            v-else-if="tabs === 'activities'"
            :contributor="contributor"
          />
          <lf-contributor-details-notes
            v-else-if="tabs === 'notes'"
            ref="notes"
            :contributor="contributor"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import { onMounted, ref } from 'vue';
import LfBack from '@/ui-kit/back/Back.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import { useRoute } from 'vue-router';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import LfContributorDetailsOverview from '@/modules/contributor/components/details/contributor-details-overview.vue';
import LfContributorDetailsActivities
  from '@/modules/contributor/components/details/contributor-details-activities.vue';
import LfContributorDetailsNotes from '@/modules/contributor/components/details/contributor-details-notes.vue';
import LfContributorDetailsWorkHistory
  from '@/modules/contributor/components/details/contributor-details-work-history.vue';
import LfContributorDetailsIdentities
  from '@/modules/contributor/components/details/contributor-details-identities.vue';
import LfContributorDetailsHeader from '@/modules/contributor/components/details/contributor-details-header.vue';
import LfContributorDetailsActions from '@/modules/contributor/components/details/contributor-details-actions.vue';
import LfContributorLastEnrichment from '@/modules/contributor/components/shared/contributor-last-enrichment.vue';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import LfContributorSyncingActivities from '@/modules/contributor/components/shared/contributor-syncing-activities.vue';
import { MergeActionState } from '@/shared/modules/merge/types/MemberActions';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';

const { getMemberCustomAttributes } = useMemberStore();

const contributorStore = useContributorStore();
const { getContributor } = contributorStore;
const { contributor } = storeToRefs(contributorStore);

const { isMasked } = useContributorHelpers();

const route = useRoute();

const tabs = ref('overview');

const notes = ref<any>(null);

const { id } = route.params;

const loading = ref<boolean>(true);

const hovered = ref<boolean>(false);

const fetchContributor = () => {
  if (!contributor.value) {
    loading.value = true;
  }
  getContributor(id)
    .finally(() => {
      loading.value = false;
    });
};

const controlScroll = (e) => {
  if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 10) {
    if (tabs.value === 'notes') {
      notes.value.loadMore();
    }
  }
};

onMounted(() => {
  contributor.value = null;
  fetchContributor();
  getMemberCustomAttributes();
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsPage',
};
</script>

<style>
.contributor-details{
  max-width: 67.5rem;
  height: calc(100vh - 4.25rem);
  grid-template-rows: min-content auto;
  grid-template-columns: 20rem auto;
  @apply w-full mx-auto;
}
</style>
