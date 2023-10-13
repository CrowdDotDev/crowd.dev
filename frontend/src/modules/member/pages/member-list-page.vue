<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <div class="flex items-center justify-between">
          <h4>
            Contacts
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
                Add contact
              </el-button>
            </router-link>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all contacts from your community
        </div>
      </div>

      <cr-saved-views
        v-model="filters"
        :config="memberSavedViews"
        :filters="memberFilters"
        placement="member"
        @update:model-value="memberFilter.alignFilterList($event)"
      />
      <cr-filter
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
        @update:pagination="onPaginationChange"
      />
    </div>
  </app-page-wrapper>
</template>

<script setup lang="ts">
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import {
  ref, onMounted, computed,
} from 'vue';
import { MemberService } from '@/modules/member/member-service';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters, mapActions } from '@/shared/vuex/vuex.helpers';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import CrSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import AppMemberListTable from '@/modules/member/components/list/member-list-table.vue';
import { memberFilters, memberSearchFilter } from '../config/filters/main';
import { memberSavedViews } from '../config/saved-views/main';

const memberStore = useMemberStore();
const { getMemberCustomAttributes, fetchMembers } = memberStore;
const { filters, customAttributesFilter, savedFilterBody } = storeToRefs(memberStore);

const membersCount = ref(0);
const membersToMergeCount = ref(0);

const { listByPlatform } = mapGetters('integration');
const { currentUser, currentTenant } = mapGetters('auth');
const { doRefreshCurrentUser } = mapActions('auth');

const memberFilter = ref<CrFilter | null>(null);

const hasIntegrations = computed(() => !!Object.keys(listByPlatform.value || {}).length);

const hasPermissionToCreate = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
)?.create);

const pagination = ref({
  page: 1,
  perPage: 20,
});

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
    .then(({ count }: any) => {
      membersToMergeCount.value = count;
    });
};

const loading = ref(true);

const doGetMembersCount = () => {
  (MemberService.listMembers({
    limit: 1,
    offset: 0,
  }, true) as Promise<any>)
    .then(({ count }) => {
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
  })
    .finally(() => {
      loading.value = false;
    });
};
const onPaginationChange = ({
  page, perPage,
}: FilterQuery) => {
  fetchMembers({
    reload: true,
    body: {
      offset: (page - 1) * perPage || 0,
      limit: perPage || 20,
    },
  });
};

onMounted(() => {
  doRefreshCurrentUser({});
  fetchMembersToMergeCount();
  doGetMembersCount();
  getMemberCustomAttributes();
  (window as any).analytics.page('Members');
});
</script>
