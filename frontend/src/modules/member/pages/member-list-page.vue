<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-primary-600 mb-2.5" />
        <div class="flex items-center justify-between">
          <h4>People</h4>
          <div class="flex items-center">
            <router-link
              v-if="membersToMergeCount > 0 && hasPermission(LfPermission.mergeMembers)"
              class="mr-4"
              :to="{
                name: 'memberMergeSuggestions',
                query: { projectGroup: selectedProjectGroup?.id },
              }"
            >
              <lf-button
                type="secondary-gray"
                size="medium"
                class="flex items-center"
              >
                <lf-icon name="shuffle" :size="16" class="text-gray-900 mr-2" />
                <span class="text-gray-900">Merge suggestions</span>
                <span
                  v-if="membersToMergeCount > 0"
                  class="ml-2 bg-primary-100 text-primary-500 py-px px-1.5 leading-5 rounded-full font-semibold"
                >{{ Math.ceil(membersToMergeCount) }}</span>
              </lf-button>
            </router-link>

            <lf-button
              v-if="
                hasPermission(LfPermission.memberCreate)
                  && (hasIntegrations || membersCount > 0)
              "
              type="primary"
              size="medium"
              @click="memberCreate = true"
            >
              Add person
            </lf-button>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          List of all the people who interacted with {{ selectedProjectGroup?.name }} projects
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
        @on-add-member="memberCreate = true"
      />
    </div>
  </app-page-wrapper>

  <lf-contributor-add v-if="memberCreate" v-model="memberCreate" />
</template>

<script setup lang="ts">
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import {
  ref, onMounted, computed,
  watch,
} from 'vue';
import { MemberService } from '@/modules/member/member-service';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import LfSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import AppMemberListTable from '@/modules/member/components/list/member-list-table.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfContributorAdd from '@/modules/contributor/components/edit/contributor-add.vue';
import allMembers from '@/modules/member/config/saved-views/views/all-members';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { memberFilters, memberSearchFilter } from '../config/filters/main';
import { memberSavedViews, memberStaticViews } from '../config/saved-views/main';

const memberStore = useMemberStore();
const { getMemberCustomAttributes, fetchMembers } = memberStore;
const { filters, customAttributesFilter, savedFilterBody } = storeToRefs(memberStore);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const membersCount = ref(0);
const membersToMergeCount = ref(0);
const memberCreate = ref(false);

const { listByPlatform } = mapGetters('integration');

const { hasPermission } = usePermissions();

const memberFilter = ref<LfFilter | null>(null);

const hasIntegrations = computed(() => !!Object.keys(listByPlatform.value || {}).length);

const pagination = ref({
  page: 1,
  perPage: 20,
});

filters.value = { ...allMembers.config };

const fetchMembersToMergeCount = () => {
  MemberService.fetchMergeSuggestions(0, 0, {
    countOnly: true,
  })
    .then(({ count }: any) => {
      membersToMergeCount.value = count;
    });
};

const loading = ref(true);
const tableLoading = ref(true);

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
  search, filter, orderBy, body,
}: FilterQuery) => {
  if (!loading.value) {
    loading.value = showLoading(filter, body);
  }

  pagination.value.page = 1;
  fetchMembers({
    body: {
      ...body,
      search,
      filter,
      offset: 0,
      limit: pagination.value.perPage,
      orderBy,
    },
  }).then((result) => {
    if (result && result.count !== undefined) {
      membersCount.value = result.count;
    }
  }).finally(() => {
    tableLoading.value = false;
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

watch(
  selectedProjectGroup,
  (newProjectGroup, oldProjectGroup) => {
    if (newProjectGroup?.id !== oldProjectGroup?.id) {
      pagination.value.page = 1;
      loading.value = true;
      tableLoading.value = true;

      fetchMembers({
        reload: true,
        body: {
          offset: 0,
          limit: pagination.value.perPage,
        },
      }).then((result) => {
        if (result && result.count !== undefined) {
          membersCount.value = result.count;
        }
      }).finally(() => {
        tableLoading.value = false;
        loading.value = false;
      });

      fetchMembersToMergeCount();
    }
  },
);

onMounted(() => {
  fetchMembersToMergeCount();
  getMemberCustomAttributes();
  (window as any).analytics.page('Members');
});
</script>
