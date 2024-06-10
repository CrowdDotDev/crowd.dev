<template>
  <div v-if="loading || !organization" class="flex justify-center py-20">
    <lf-spinner />
  </div>
  <div v-else class="-mt-5 -mb-5">
    <div class="organization-details  grid grid-cols-2 grid-rows-2 px-3">
      <section class="w-full border-b border-gray-100 py-4 flex justify-between items-center col-span-2 h-min">
        <div class="flex items-center">
          <lf-back :to="{ path: '/organizations' }" class="mr-2">
            <lf-button type="secondary-ghost" :icon-only="true">
              <lf-icon name="arrow-left-s-line" />
            </lf-button>
          </lf-back>
          <lf-organization-details-header :organization="organization" />
        </div>
        <div class="flex items-center">
          <lf-organization-last-enrichment :organization="organization" class="mr-4" />
          <lf-organization-details-actions :organization="organization" @reload="fetchOrganization()" />
        </div>
      </section>
      <section class="w-80 border-r relative border-gray-100 overflow-y-auto overflow-x-visible h-full ">
        <div class="sticky top-0 left-0 w-full h-6 bg-gradient-to-b from-white to-transparent" />
        <div class="pr-8 pb-10">
          <lf-organization-details-identities
            :organization="organization"
            class="mb-8"
            @reload="fetchOrganization()"
          />
          <lf-organization-details-domains
            :organization="organization"
            class="mb-8"
            @reload="fetchOrganization()"
          />
          <lf-organization-details-phone-numbers
            :organization="organization"
            @reload="fetchOrganization()"
          />
        </div>
      </section>
      <section class="overflow-auto h-full pb-10">
        <div class="sticky top-0 z-10">
          <div class="bg-white pt-5 pl-10 pb-3">
            <lf-tabs v-model="tabs">
              <lf-tab name="overview">
                Overview
              </lf-tab>
              <lf-tab name="contacts">
                Contacts
              </lf-tab>
              <lf-tab name="activities">
                Activities
              </lf-tab>
            </lf-tabs>
          </div>
          <div class="w-full h-5 bg-gradient-to-b from-white to-transparent pl-10" />
        </div>
        <div class="pl-10">
          <lf-organization-details-overview v-if="tabs === 'overview'" :organization="organization" />
          <lf-organization-details-contacts v-else-if="tabs === 'contacts'" :organization="organization" />
          <lf-organization-details-activities v-else-if="tabs === 'activities'" :organization="organization" />
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
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useRoute } from 'vue-router';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import { Organization } from '@/modules/organization/types/Organization';
import { OrganizationApiService } from '@/modules/organization/services/organization.api.service';
import LfOrganizationDetailsHeader from '@/modules/organization/components/details/organization-details-header.vue';
import LfContributorDetailsActions from '@/modules/contributor/components/details/contributor-details-actions.vue';
import LfContributorLastEnrichment from '@/modules/contributor/components/shared/contributor-last-enrichment.vue';
import LfOrganizationLastEnrichment from '@/modules/organization/components/shared/organization-last-enrichment.vue';
import LfOrganizationDetailsActions from '@/modules/organization/components/details/organization-details-actions.vue';
import LfOrganizationDetailsOverview from '@/modules/organization/components/details/organization-details-overview.vue';
import LfOrganizationDetailsContacts from '@/modules/organization/components/details/organization-details-contacts.vue';
import LfOrganizationDetailsActivities
  from '@/modules/organization/components/details/organization-details-activities.vue';
import LfOrganizationDetailsIdentities
  from '@/modules/organization/components/details/organization-details-identities.vue';
import LfOrganizationDetailsDomains from '@/modules/organization/components/details/organization-details-domains.vue';
import LfOrganizationDetailsPhoneNumbers
  from '@/modules/organization/components/details/organization-details-phone-numbers.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const route = useRoute();

const tabs = ref('overview');

const { id } = route.params;

const organization = ref<Organization | null>(null);
const loading = ref<boolean>(true);
const fetchOrganization = () => {
  if (!organization.value) {
    loading.value = true;
  }
  OrganizationApiService.find(id as string, [selectedProjectGroup.value?.id as string])
    .then((res) => {
      console.log(res);
      organization.value = res;
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  fetchOrganization();
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsPage',
};
</script>

<style>
.organization-details{
  max-width: 67.5rem;
  height: calc(100vh - 4.25rem);
  grid-template-rows: min-content auto;
  grid-template-columns: 20rem auto;
  @apply w-full mx-auto;
}
</style>
