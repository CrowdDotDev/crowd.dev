<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-brand-500 mb-2.5" />
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
                  && (hasIntegrations || hasMembers)
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

      <app-member-list-tabs />
      <app-member-list-filter
        v-if="hasMembers"
      />
      <app-member-list-table
        :has-integrations="hasIntegrations"
        :has-members="hasMembers"
        :is-page-loading="isPageLoading"
      />
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import moment from 'moment';
import MemberListFilter from '@/modules/member/components/list/member-list-filter.vue';
import MemberListTable from '@/modules/member/components/list/member-list-table.vue';
import MemberListTabs from '@/modules/member/components/list/member-list-tabs.vue';
import PageWrapper from '@/shared/layout/page-wrapper.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import { MemberService } from '../member-service';
import { MemberPermissions } from '../member-permissions';

export default {
  name: 'AppMemberListPage',

  components: {
    'app-member-list-filter': MemberListFilter,
    'app-member-list-table': MemberListTable,
    'app-member-list-tabs': MemberListTabs,
    'app-page-wrapper': PageWrapper,
    AppLfPageHeader,
  },

  data() {
    return {
      membersToMergeCount: 0,
      hasMembers: false,
      isPageLoading: true,
    };
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      integrations: 'integration/listByPlatform',
      activeView: 'member/activeView',
    }),

    hasIntegrations() {
      return !!Object.keys(this.integrations || {}).length;
    },

    hasPermissionToCreate() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser,
      ).create;
    },

    isCreateLockedForSampleData() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser,
      ).createLockedForSampleData;
    },

    isEditLockedForSampleData() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser,
      ).editLockedForSampleData;
    },
  },

  async created() {
    const { filter } = this.$store.state.member;

    this.isPageLoading = true;

    await this.doFetchIntegrations();
    await this.doFetchCustomAttributes();

    const { joinedFrom, activeFrom } = this.$route.query;
    if (
      joinedFrom
      && moment(joinedFrom, 'YYYY-MM-DD', true).isValid()
    ) {
      await this.updateFilterAttribute({
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
      await this.updateFilterAttribute({
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
      this.SORTER_CHANGED({
        activeView: this.activeView,
        sorter: {
          prop: 'activityCount',
          order: 'descending',
        },
      });
    }
    await this.doFetch({
      filter,
      keepPagination: true,
    });

    const membersList = await this.doGetMembersCount();
    const mergeSuggestions = await MemberService.fetchMergeSuggestions(1, 0);

    this.membersToMergeCount = mergeSuggestions.count;
    this.hasMembers = membersList.count > 0;
    this.isPageLoading = false;
  },

  async mounted() {
    window.analytics.page('Members');
  },

  methods: {
    ...mapMutations({
      SORTER_CHANGED: 'member/SORTER_CHANGED',
    }),
    ...mapActions({
      doFetchWidgets: 'widget/doFetch',
      doFetchCustomAttributes:
        'member/doFetchCustomAttributes',
      updateFilterAttribute: 'member/updateFilterAttribute',
      doFetch: 'member/doFetch',
      doFetchIntegrations: 'integration/doFetch',
    }),

    async doGetMembersCount() {
      try {
        const response = await MemberService.list({
          customFilters: {},
          orderBy: '',
          limit: 1,
          offset: 0,
          segments: [],
          buildFilter: undefined,
          countOnly: true,
        });

        return response;
      } catch (e) {
        return null;
      }
    },
  },
};
</script>
