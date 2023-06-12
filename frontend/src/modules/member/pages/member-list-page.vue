<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-brand-500 mb-2.5" />
        <div class="flex items-center justify-between">
          <h4>Members</h4>
          <div class="flex items-center">
            <router-link
              class="mr-4"
              :class="{ 'pointer-events-none': isEditLockedForSampleData }"
              :to="{
                name: 'memberMergeSuggestions',
              }"
            >
              <button
                :disabled="isEditLockedForSampleData"
                type="button"
                class="btn btn--bordered btn--md flex items-center"
              >
                <span class="ri-shuffle-line text-base mr-2 text-gray-900" />
                <span class="text-gray-900">Merge suggestions</span>
                <span
                  v-if="membersToMergeCount > 0"
                  class="ml-2 bg-brand-100 text-brand-500 py-px px-1.5 leading-5 rounded-full font-semibold"
                >{{ Math.ceil(membersToMergeCount) }}</span>
              </button>
            </router-link>

            <el-button
              v-if="
                hasPermissionToCreate && (hasIntegrations || membersCount > 0)
              "
              class="btn btn--primary btn--md"
              :class="{
                'pointer-events-none cursor-not-allowed':
                  isCreateLockedForSampleData,
              }"
              :disabled="isCreateLockedForSampleData"
              @click="onAddMember"
            >
              Add member
            </el-button>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all members from your community
        </div>
      </div>

      <cr-saved-views
        v-model="filters"
        :config="memberSavedViews"
        :views="memberViews"
      />
      <cr-filter
        v-if="customAttributesFilter"
        v-model="filters"
        :config="memberFilters"
        :search-config="memberSearchFilter"
        :saved-views-config="memberSavedViews"
        :custom-config="customAttributesFilter"
        @fetch="fetch($event)"
      />
      <app-member-list-table
        :has-integrations="hasIntegrations"
        :has-members="membersCount > 0"
        :is-page-loading="loading"
        @on-add-member="isSubProjectSelectionOpen = true"
      />
    </div>
  </app-page-wrapper>

  <app-lf-sub-projects-list-modal
    v-if="isSubProjectSelectionOpen"
    v-model="isSubProjectSelectionOpen"
    title="Add member"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup lang="ts">
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppLfSubProjectsListModal from '@/modules/lf/segments/components/lf-sub-projects-list-modal.vue';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { ref, onMounted, computed } from 'vue';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import CrSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import AppMemberListTable from '@/modules/member/components/list/member-list-table.vue';
import { useRouter } from 'vue-router';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { memberFilters, memberSearchFilter } from '../config/filters/main';
import { memberSavedViews, memberViews } from '../config/saved-views/main';
import { MemberPermissions } from '../member-permissions';
import { MemberService } from '../member-service';

const router = useRouter();

const memberStore = useMemberStore();
const { getMemberCustomAttributes, fetchMembers } = memberStore;
const { filters, customAttributesFilter, savedFilterBody } = storeToRefs(memberStore);

const membersCount = ref(0);
const membersToMergeCount = ref(0);

const isSubProjectSelectionOpen = ref(false);

const { listByPlatform } = mapGetters('integration');
const { currentUser, currentTenant } = mapGetters('auth');

const hasIntegrations = computed(
  () => !!Object.keys(listByPlatform.value || {}).length,
);

const hasPermissionToCreate = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)?.create,
);

const isCreateLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)?.createLockedForSampleData,
);

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)?.editLockedForSampleData,
);

const fetchMembersToMergeCount = () => {
  MemberService.fetchMergeSuggestions(1, 0).then(({ count }: any) => {
    membersToMergeCount.value = count;
  });
};

const loading = ref(true);

const doGetMembersCount = () => {
  (
    MemberService.listMembers(
      {
        limit: 1,
        offset: 0,
      },
      true,
    ) as Promise<any>
  ).then(({ count }) => {
    membersCount.value = count;
  });
};

const showLoading = (filter: any, body: any): boolean => {
  const saved: any = { ...savedFilterBody.value };
  delete saved.offset;
  delete saved.limit;
  delete saved.orderBy;
  const compare = {
    ...body,
    filter,
  };
  return JSON.stringify(saved) !== JSON.stringify(compare);
};

const fetch = ({
  filter,
  offset,
  limit,
  orderBy,
  body,
}: FilterQuery) => {
  loading.value = showLoading(filter, body);
  fetchMembers({
    body: {
      ...body,
      filter,
      offset,
      limit,
      orderBy,
    },
  }).finally(() => {
    loading.value = false;
  });
};

const onAddMember = () => {
  isSubProjectSelectionOpen.value = true;
};

const onSubProjectSelection = (subprojectId) => {
  isSubProjectSelectionOpen.value = false;
  router.push({
    name: 'memberCreate',
    query: {
      subprojectId,
    },
  });
};

onMounted(() => {
  fetchMembersToMergeCount();
  doGetMembersCount();
  getMemberCustomAttributes();
  (window as any).analytics.page('Members');
});
</script>
