<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <div class="flex items-center justify-between">
          <h4>
            Members
          </h4>
          <div class="flex items-center">
            <router-link
              class=" mr-4 "
              :class="{ 'pointer-events-none': isEditLockedForSampleData }"
              :to="{
                name: 'memberMergeSuggestions',
              }"
            >
              <button :disabled="isEditLockedForSampleData" type="button" class="btn btn--bordered btn--md flex items-center">
                <span class="ri-shuffle-line text-base mr-2 text-gray-900" />
                <span class="text-gray-900">Merge suggestions</span>
                <span
                  v-if="membersToMergeCount > 0"
                  class="ml-2 bg-brand-100 text-brand-500 py-px px-1.5 leading-5 rounded-full font-semibold"
                >{{ Math.ceil(membersToMergeCount) }}</span>
              </button>
            </router-link>

            <router-link
              v-if="
                hasPermissionToCreate
                  && (hasIntegrations || membersCount > 0)
              "
              :to="{
                name: 'memberCreate',
              }"
              :class="{
                'pointer-events-none cursor-not-allowed':
                  isCreateLockedForSampleData,
              }"
            >
              <el-button
                class="btn btn--primary btn--md"
                :disabled="isCreateLockedForSampleData"
              >
                Add member
              </el-button>
            </router-link>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all members from your community
        </div>
      </div>

      <cr-saved-views v-model="filters" :config="memberSavedViews" :views="memberViews" />
      <cr-filter
        v-if="customAttributes"
        v-model="filters"
        :config="memberFilters"
        :search-config="memberSearchFilter"
        :saved-views-config="memberSavedViews"
        :custom-config="customAttributes"
        @fetch="fetch($event)"
      />
      <!--      <app-member-list-table-->
      <!--        :has-integrations="hasIntegrations"-->
      <!--        :has-members="hasMembers"-->
      <!--        :is-page-loading="isPageLoading"-->
      <!--      />-->
    </div>
  </app-page-wrapper>
</template>

<script setup lang="ts">
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { ref, onMounted, computed } from 'vue';
import { MemberService } from '@/modules/member/member-service';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import CrSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import { memberFilters, memberSearchFilter } from '../config/filters/main';
import { memberSavedViews, memberViews } from '../config/saved-views/main';
// import MemberListFilter from '@/modules/member/components/list/member-list-filter.vue';
// import MemberListTable from '@/modules/member/components/list/member-list-table.vue';
// import MemberListTabs from '@/modules/member/components/list/member-list-tabs.vue';

const memberStore = useMemberStore();
const { getMemberCustomAttributes } = memberStore;
const { filters, customAttributes } = storeToRefs(memberStore);

const membersCount = ref(0);
const membersToMergeCount = ref(0);

const { listByPlatform } = mapGetters('integration');
const { currentUser, currentTenant } = mapGetters('auth');

const hasIntegrations = computed(() => !!Object.keys(listByPlatform.value || {}).length);

const hasPermissionToCreate = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
)?.create);

const isCreateLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
)?.createLockedForSampleData);

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
)?.editLockedForSampleData);

const fetchMembersToMergeCount = () => {
  MemberService.fetchMergeSuggestions(1, 0)
    .then(({ count }) => {
      membersToMergeCount.value = count;
    });
};

const doGetMembersCount = () => {
  (MemberService.list(
    {},
    '',
    1,
    0,
    false,
    true,
  ) as Promise<any>)
    .then(({ count }) => {
      membersCount.value = count;
    });
};

const fetch = ({
  filter, offset, limit, orderBy, body,
}: FilterQuery) => {
  console.log(filter, offset, limit, orderBy, body);
  // TODO: fetch members
};

onMounted(() => {
  fetchMembersToMergeCount();
  doGetMembersCount();
  getMemberCustomAttributes();
  (window as any).analytics.page('Members');
});
</script>
