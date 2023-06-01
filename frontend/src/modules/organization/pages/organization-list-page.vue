<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-brand-500 mb-2.5" />
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <h4>Organizations</h4>
          </div>
          <div class="flex items-center">
            <router-link
              v-if="hasPermissionToCreate"
              :to="{
                name: 'organizationCreate',
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
                Add organization
              </el-button>
            </router-link>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all organizations that relate to your
          community
        </div>
      </div>

      <app-organization-list-tabs />
      <app-organization-list-filter />
      <app-organization-list-table
        :has-organizations="hasOrganizations"
        :is-page-loading="isPageLoading"
      />
    </div>
  </app-page-wrapper>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import moment from 'moment/moment';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import AppOrganizationListTabs from '@/modules/organization/components/list/organization-list-tabs.vue';
import AppOrganizationListFilter from '@/modules/organization/components/list/organization-list-filter.vue';
import AppOrganizationListTable from '@/modules/organization/components/list/organization-list-table.vue';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import { OrganizationPermissions } from '../organization-permissions';
import { OrganizationService } from '../organization-service';

const route = useRoute();

const { currentUser, currentTenant } = mapGetters('auth');
const { doFetch, updateFilterAttribute } = mapActions('organization');

const hasPermissionToCreate = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).create,
);
const isCreateLockedForSampleData = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).createLockedForSampleData,
);
const hasOrganizations = ref(false);
const isPageLoading = ref(false);

const doGetOrganizationsCount = async () => {
  try {
    const response = await OrganizationService.list(
      {},
      '',
      1,
      0,
    );

    return response.rows;
  } catch (e) {
    return null;
  }
};

onMounted(async () => {
  isPageLoading.value = true;
  const { joinedFrom, activeFrom } = route.query;

  if (
    joinedFrom
    && moment(joinedFrom, 'YYYY-MM-DD', true).isValid()
  ) {
    await updateFilterAttribute({
      custom: false,
      defaultOperator: 'gt',
      defaultValue: joinedFrom,
      expanded: false,
      label: 'Joined date',
      name: 'joinedAt',
      operator: 'gt',
      type: 'date',
      value: joinedFrom,
    });
  }
  if (
    activeFrom
    && moment(activeFrom, 'YYYY-MM-DD', true).isValid()
  ) {
    await updateFilterAttribute({
      custom: false,
      defaultOperator: 'eq',
      defaultValue: activeFrom,
      expanded: false,
      label: 'Last activity date',
      name: 'lastActive',
      operator: 'gt',
      type: 'date',
      value: activeFrom,
    });
  }

  await doFetch({
    keepPagination: true,
  });

  const organizationsList = await doGetOrganizationsCount();

  hasOrganizations.value = !!organizationsList?.length;
  isPageLoading.value = false;
});
</script>
