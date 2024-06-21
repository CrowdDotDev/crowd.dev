<template>
  <div v-if="loading || !contributor" class="flex justify-center py-20">
    <lf-spinner />
  </div>
  <div v-else class="-mt-5 -mb-5">
    <div class="contributor-details  grid grid-cols-2 grid-rows-2 px-3">
      <section class="w-full border-b border-gray-100 py-4 flex justify-between items-center col-span-2 h-min group">
        <div class="flex items-center">
          <lf-back :to="{ path: '/contributors' }" class="mr-2">
            <lf-button type="secondary-ghost" :icon-only="true">
              <lf-icon name="arrow-left-s-line" />
            </lf-button>
          </lf-back>
          <lf-contributor-details-header :contributor="contributor" />
        </div>
        <div class="flex items-center">
          <lf-contributor-last-enrichment :contributor="contributor" class="mr-4" />
          <lf-contributor-details-actions :contributor="contributor" @reload="fetchMember()" />
        </div>
      </section>
      <section class="w-80 border-r relative border-gray-100 overflow-y-auto overflow-x-visible h-full ">
        <div class="sticky top-0 left-0 w-full h-6 bg-gradient-to-b from-white to-transparent" />
        <div class="pr-8 pb-10">
          <lf-contributor-details-work-history
            :contributor="contributor"
            class="mb-8"
            @reload="fetchMember()"
          />
          <lf-contributor-details-identities
            :contributor="contributor"
            class="mb-8"
            @reload="fetchMember()"
          />
          <lf-contributor-details-emails
            :contributor="contributor"
            @reload="fetchMember()"
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
                Activities
              </lf-tab>
              <lf-tab v-model="tabs" name="notes">
                Notes
              </lf-tab>
            </lf-tabs>
          </div>
          <div class="w-full h-5 bg-gradient-to-b from-white to-transparent pl-10" />
        </div>
        <div class="pl-10">
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
import LfContributorDetailsOverview from '@/modules/contributor/components/details/contributor-details-overview.vue';
import LfContributorDetailsActivities
  from '@/modules/contributor/components/details/contributor-details-activities.vue';
import LfContributorDetailsNotes from '@/modules/contributor/components/details/contributor-details-notes.vue';
import LfContributorDetailsWorkHistory
  from '@/modules/contributor/components/details/contributor-details-work-history.vue';
import LfContributorDetailsIdentities
  from '@/modules/contributor/components/details/contributor-details-identities.vue';
import LfBack from '@/ui-kit/back/Back.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfContributorDetailsHeader from '@/modules/contributor/components/details/contributor-details-header.vue';
import LfContributorDetailsActions from '@/modules/contributor/components/details/contributor-details-actions.vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfContributorDetailsEmails from '@/modules/contributor/components/details/contributor-details-emails.vue';
import LfContributorLastEnrichment from '@/modules/contributor/components/shared/contributor-last-enrichment.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';

const { getMemberCustomAttributes } = useMemberStore();

const contributorStore = useContributorStore();
const { getContributor } = contributorStore;
const { contributor } = storeToRefs(contributorStore);

const route = useRoute();

const tabs = ref('overview');

const notes = ref<any>(null);

const { id } = route.params;

const loading = ref<boolean>(true);

const fetchMember = () => {
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
  fetchMember();
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
