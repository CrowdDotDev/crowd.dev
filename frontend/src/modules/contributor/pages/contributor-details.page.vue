<template>
  <div v-if="loading || !contributor" class="flex justify-center py-20">
    <lf-spinner />
  </div>
  <div v-else class="contributor-details -mt-5">
    <section class="w-full border-b border-gray-100 py-4 flex justify-between items-center">
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
    <div class="flex flex-nowrap">
      <section class="w-80 shrink-0 border-r border-gray-100 pt-6 pr-8">
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
      </section>
      <section class="pt-5 pl-10 flex-grow">
        <lf-tabs v-model="tabs" class="mb-8">
          <lf-tab name="overview">
            Overview
          </lf-tab>
          <lf-tab name="activities">
            Activities
          </lf-tab>
          <lf-tab name="notes">
            Notes
          </lf-tab>
        </lf-tabs>
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
          :contributor="contributor"
        />
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
import { ContributorApiService } from '@/modules/contributor/services/contributor.api.service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfContributorDetailsEmails from '@/modules/contributor/components/details/contributor-details-emails.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import LfContributorLastEnrichment from '@/modules/contributor/components/shared/contributor-last-enrichment.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const route = useRoute();

const tabs = ref('overview');

const { id } = route.params;

const contributor = ref<Contributor | null>(null);
const loading = ref<boolean>(true);
const fetchMember = () => {
  if (!contributor.value) {
    loading.value = true;
  }
  ContributorApiService.find(id as string, [selectedProjectGroup.value?.id as string])
    .then((res) => {
      console.log(res);
      contributor.value = res;
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  fetchMember();
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
  @apply w-full mx-auto;
}
</style>
