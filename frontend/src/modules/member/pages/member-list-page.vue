<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-primary-600 mb-2.5" />
        <div class="flex items-center justify-between">
          <h4>Contributors</h4>
          <div class="flex items-center">
            <router-link
              v-if="membersToMergeCount > 0 && hasPermission(LfPermission.mergeMembers)"
              class="mr-4"
              :to="{
                name: 'memberMergeSuggestions',
                query: { projectGroup: selectedProjectGroup?.id },
              }"
            >
              <button
                type="button"
                class="btn btn--secondary btn--md flex items-center"
              >
                <span class="ri-shuffle-line text-base mr-2 text-gray-900" />
                <span class="text-gray-900">Merge suggestions</span>
                <span
                  v-if="membersToMergeCount > 0"
                  class="ml-2 bg-primary-100 text-primary-500 py-px px-1.5 leading-5 rounded-full font-semibold"
                >{{ Math.ceil(membersToMergeCount) }}</span>
              </button>
            </router-link>

            <el-button
              v-if="
                hasPermission(LfPermission.memberCreate)
                  && (hasIntegrations || membersCount > 0)
              "
              class="btn btn--primary btn--md"
              @click="onAddMember"
            >
              Add contributor
            </el-button>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all contributors that interacted with your product or community
        </div>
      </div>

      <lf-saved-views
        v-model="filters"
        :config="memberSavedViews"
        :filters="memberFilters"
        :custom-filters="customAttributesFilter"
        :static-views="memberStaticViews"
        placement="member"
        @update:model-value="memberFilter.alignFilterList($event)"
      />
      <lf-filter
        v-if="customAttributesFilter"
        ref="memberFilter"
        v-model="filters"
        :config="memberFilters"
        :search-config="memberSearchFilter"
        :saved-views-config="memberSavedViews"
        :custom-config="customAttributesFilter"
        @fetch="fetch($event)"
      />
      <app-member-list-table
        v-model:pagination="pagination"
        :has-integrations="hasIntegrations"
        :has-members="membersCount > 0"
        :is-page-loading="loading"
        :is-table-loading="tableLoading"
        @update:pagination="onPaginationChange"
        @on-add-member="isSubProjectSelectionOpen = true"
      />
    </div>
  </app-page-wrapper>

  <app-lf-sub-projects-list-modal
    v-if="isSubProjectSelectionOpen"
    v-model="isSubProjectSelectionOpen"
    title="Add contributor"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup lang="ts">
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppLfSubProjectsListModal from '@/modules/lf/segments/components/lf-sub-projects-list-modal.vue';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import {
  ref, onMounted, computed,
} from 'vue';
import { MemberService } from '@/modules/member/member-service';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import LfSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import AppMemberListTable from '@/modules/member/components/list/member-list-table.vue';
import { useRouter } from 'vue-router';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { memberFilters, memberSearchFilter } from '../config/filters/main';
import { memberSavedViews, memberStaticViews } from '../config/saved-views/main';

const router = useRouter();

const memberStore = useMemberStore();
const { getMemberCustomAttributes, fetchMembers } = memberStore;
const { filters, customAttributesFilter, savedFilterBody } = storeToRefs(memberStore);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const membersCount = ref(0);
const membersToMergeCount = ref(0);
const isSubProjectSelectionOpen = ref(false);

const { listByPlatform } = mapGetters('integration');

const { hasPermission } = usePermissions();

const memberFilter = ref<LfFilter | null>(null);

const hasIntegrations = computed(() => !!Object.keys(listByPlatform.value || {}).length);

const pagination = ref({
  page: 1,
  perPage: 20,
});

const fetchMembersToMergeCount = () => {
  MemberService.fetchMergeSuggestions(0, 0, {
    countOnly: true,
  })
    .then(({ count }: any) => {
      membersToMergeCount.value = count;
    });
};

const loading = ref(true);
const tableLoading = ref(false);

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
  filter, orderBy, body,
}: FilterQuery) => {
  if (!loading.value) {
    loading.value = showLoading(filter, body);
  }
  pagination.value.page = 1;
  fetchMembers({
    body: {
      ...body,
      filter,
      offset: 0,
      limit: pagination.value.perPage,
      orderBy,
    },
  }).finally(() => {
    loading.value = false;
  });
};
const onPaginationChange = ({
  page, perPage,
}: FilterQuery) => {
  tableLoading.value = true;
  fetchMembers({
    reload: true,
    body: {
      offset: (page - 1) * perPage || 0,
      limit: perPage || 20,
    },
  }).finally(() => {
    tableLoading.value = false;
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
