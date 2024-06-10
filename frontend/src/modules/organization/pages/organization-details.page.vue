<template>
  <div v-if="loading || !organization" class="flex justify-center py-20">
    <lf-spinner />
  </div>
  <div v-else class="-mt-5 -mb-5">
    <div class="contributor-details  grid grid-cols-2 grid-rows-2 px-3">
      <section class="w-full border-b border-gray-100 py-4 flex justify-between items-center col-span-2 h-min">
        <div class="flex items-center">
          <lf-back :to="{ path: '/organizations' }" class="mr-2">
            <lf-button type="secondary-ghost" :icon-only="true">
              <lf-icon name="arrow-left-s-line" />
            </lf-button>
          </lf-back>
        </div>
        <div class="flex items-center">
        </div>
      </section>
      <section class="w-80 border-r relative border-gray-100 overflow-y-auto overflow-x-visible h-full ">
        <div class="sticky top-0 left-0 w-full h-6 bg-gradient-to-b from-white to-transparent" />
        <div class="pr-8 pb-10">
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
