<template>
  <app-page-wrapper size="narrow">
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center mt-1 mb-4"
      :to="{ path: '/organizations' }"
    >
      <i class="ri-arrow-left-s-line mr-2" />Organizations
    </router-link>
    <h4 class="text-xl font-semibold leading-9 mb-1">
      Merging suggestions
    </h4>
    <div class="text-xs text-gray-600 pb-6">
      crowd.dev is constantly checking your community for duplicate organizations.
      Here you can check all the merging suggestions.
    </div>

    <div v-if="loading || count > 0" class="panel">
      <!-- Header -->
      <header class="flex items-center justify-between pb-4">
        <button
          type="button"
          class="btn btn--transparent btn--md"
          :disabled="loading || offset <= 0"
          @click="fetch(offset - 1)"
        >
          <span class="ri-arrow-left-s-line text-lg mr-2" />
          <span>Previous</span>
        </button>
        <app-loading v-if="loading" height="16px" width="131px" radius="3px" />
        <div
          v-else
          class="text-sm leading-5 text-gray-500 flex flex-wrap justify-center"
        >
          <div>{{ offset + 1 }} of {{ Math.ceil(count) }} suggestions</div>
          <div
            v-if="organizationsToMerge.similarity"
            class="w-full flex items-center justify-center pt-2"
          >
            <div
              class="flex text-sm"
              :style="{
                color: confidence.color,
              }"
            >
              <div class="pr-1" v-html="confidence.svg" />
              {{ Math.round(organizationsToMerge.similarity * 100) }}% confidence
            </div>
          </div>
        </div>
        <button
          type="button"
          class="btn btn--transparent btn--md"
          :disabled="loading || offset >= count - 1"
          @click="fetch(offset + 1)"
        >
          <span>Next</span>
          <span class="ri-arrow-right-s-line text-lg ml-2" />
        </button>
      </header>

      <!-- Comparison -->
      <!-- Loading -->
      <div v-if="loading" class="flex -mx-3">
        <div class="w-1/2 px-3">
          <app-organization-merge-suggestions-details
            :organization="null"
            :loading="true"
            :is-primary="true"
          />
        </div>
        <div class="w-1/2 px-3">
          <app-organization-merge-suggestions-details
            :organization="null"
            :loading="true"
          />
        </div>
      </div>
      <div v-else class="flex -mx-3">
        <div
          v-for="(organization, mi) of organizationsToMerge.organizations"
          :key="organization.id"
          class="w-1/2 px-3"
        >
          <app-organization-merge-suggestions-details
            :organization="organization"
            :compare-organization="
              organizationsToMerge[(mi + 1) % organizationsToMerge.organizations.length]
            "
            :is-primary="mi === primary"
            :extend-bio="bioHeight"
            @make-primary="primary = mi"
            @bio-height="$event > bioHeight ? (bioHeight = $event) : null"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex -mx-3 pt-8">
        <div class="w-1/2 px-3">
          <el-button
            :disabled="loading || isEditLockedForSampleData"
            class="btn btn--bordered btn--lg w-full"
            :loading="sendingIgnore"
            @click="ignoreSuggestion()"
          >
            Ignore suggestion
          </el-button>
        </div>
        <div class="w-1/2 px-3">
          <el-button
            :disabled="loading || isEditLockedForSampleData"
            class="btn btn--primary btn--lg w-full"
            :loading="sendingMerge"
            @click="mergeSuggestion()"
          >
            Merge organizations
          </el-button>
        </div>
      </div>
    </div>
    <!-- Empty state -->
    <div v-else class="pt-20 flex flex-col items-center">
      <div
        class="ri-shuffle-line text-gray-200 text-10xl h-40 flex items-center mb-8"
      />
      <h5 class="text-center text-lg font-semibold mb-4">
        No merge suggestions
      </h5>
      <p class="text-sm text-center text-gray-600 leading-5">
        We couldn’t find any duplicated organizations
      </p>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Message from '@/shared/message/message';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppOrganizationMergeSuggestionsDetails from '@/modules/organization/components/suggestions/organization-merge-suggestions-details.vue';
import { OrganizationService } from '../organization-service';
import { OrganizationPermissions } from '../organization-permissions';

const { currentTenant, currentUser } = mapGetters('auth');

const organizationsToMerge = ref([]);
const primary = ref(0);
const offset = ref(0);
const count = ref(0);
const loading = ref(false);

const sendingIgnore = ref(false);
const sendingMerge = ref(false);

const bioHeight = ref(0);

const isEditLockedForSampleData = computed(
  () => new OrganizationPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

const confidence = computed(() => {
  if (organizationsToMerge.value.similarity >= 0.8) {
    return {
      color: '#059669',
      svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 2.66699H17.5V17.5003H14.1667V2.66699ZM8.33337 7.5H11.6667V17.5003H8.33337V7.5Z" fill="#059669"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#059669"/>
</svg>`,
    };
  }
  if (organizationsToMerge.value.similarity >= 0.6) {
    return {
      color: '#3B82F6',
      svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1666 2.66699H17.4999V17.5003H14.1666V2.66699ZM8.33325 7.5H11.6666V17.5003H8.33325V7.5Z" fill="#D1D5DB"/>
<path d="M8.33325 7.5H11.6666V17.5003H8.33325V7.5Z" fill="#3B82F6"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#3B82F6"/>
</svg>`,
    };
  }
  return {
    color: '#D97706',
    svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 2.66699H17.5V17.5003H14.1667V2.66699ZM8.33337 7.5H11.6667V17.5003H8.33337V7.5Z" fill="#D1D5DB"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#F59E0B"/>
</svg>`,
  };
});

const fetch = (page) => {
  if (page > -1) {
    offset.value = page;
  }
  loading.value = true;

  OrganizationService.fetchMergeSuggestions(1, offset.value)
    .then((res) => {
      offset.value = +res.offset;
      count.value = res.count;
      [organizationsToMerge.value] = res.rows;
      const { organizations } = organizationsToMerge.value;
      // Set organization with maximum identities and activities as primary
      const [firstOrganization, secondOrganization] = organizations;
      primary.value = 0;
      if (firstOrganization && secondOrganization && ((firstOrganization.identities.length < secondOrganization.identities.length)
        || (firstOrganization.activityCount < secondOrganization.activityCount))) {
        primary.value = 1;
      }
    })
    .catch(() => {
      Message.error(
        'There was an error fetching merge suggestion, please try again later',
      );
    })
    .finally(() => {
      loading.value = false;
    });
};

const ignoreSuggestion = () => {
  if (sendingIgnore.value || sendingMerge.value || loading.value) {
    return;
  }
  sendingIgnore.value = true;
  OrganizationService.addToNoMerge(...organizationsToMerge.value.organizations)
    .then(() => {
      Message.success('Merging suggestion ignored successfuly');
      fetch();
    })
    .catch(() => {
      Message.error('There was an error ignoring the merging suggestion');
    })
    .finally(() => {
      sendingIgnore.value = false;
    });
};

const mergeSuggestion = () => {
  if (sendingIgnore.value || sendingMerge.value || loading.value) {
    return;
  }
  sendingMerge.value = true;
  OrganizationService.mergeOrganizations(
    organizationsToMerge.value.organizations[primary.value].id,
    organizationsToMerge.value.organizations[(primary.value + 1) % 2].id,
  )
    .then(() => {
      primary.value = 0;
      Message.success('Organizations merged successfuly');
      fetch();
    })
    .catch(() => {
      Message.error('There was an error merging organizations');
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

onMounted(async () => {
  fetch(0);
});
</script>

<script>
export default {
  name: 'AppOrganizationMergeSuggestionsPage',
};
</script>
