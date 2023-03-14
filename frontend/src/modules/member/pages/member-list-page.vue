<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <div class="flex items-center justify-between">
          <h4>
            <app-i18n
              code="entities.member.list.title"
            ></app-i18n>
          </h4>
          <div class="flex items-center">
            <div
              v-if="hasMembersToMerge"
              class="border py-2.5 pl-2 pr-3 rounded-md border-blue-200 bg-blue-50 mr-4"
            >
              <div class="flex items-center">
                <i class="ri-lightbulb-line mr-3 ri-xl"></i>
                <div class="text-sm">
                  <span class="font-semibold"
                    >Suggestion:</span
                  >
                  <span class="mr-6">
                    Merge community members</span
                  >
                  <router-link
                    :to="{
                      name: 'memberMergeSuggestions'
                    }"
                    class="font-semibold"
                    >Review suggestions</router-link
                  >
                </div>
              </div>
            </div>

            <router-link
              v-if="
                hasPermissionToCreate &&
                (hasIntegrations || hasMembers)
              "
              :to="{
                name: 'memberCreate'
              }"
              :class="{
                'pointer-events-none cursor-not-allowed':
                  isCreateLockedForSampleData
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

      <app-member-list-tabs></app-member-list-tabs>
      <app-member-list-filter
        v-if="hasMembers"
      ></app-member-list-filter>
      <app-member-list-table
        :has-integrations="hasIntegrations"
        :has-members="hasMembers"
        :is-page-loading="isPageLoading"
      ></app-member-list-table>
    </div>
  </app-page-wrapper>
</template>

<script>
import { MemberService } from '../member-service'
import MemberListFilter from '@/modules/member/components/list/member-list-filter.vue'
import MemberListTable from '@/modules/member/components/list/member-list-table.vue'
import MemberListTabs from '@/modules/member/components/list/member-list-tabs.vue'
import PageWrapper from '@/shared/layout/page-wrapper.vue'
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { MemberPermissions } from '../member-permissions'
import moment from 'moment'

export default {
  name: 'AppMemberListPage',

  components: {
    'app-member-list-filter': MemberListFilter,
    'app-member-list-table': MemberListTable,
    'app-member-list-tabs': MemberListTabs,
    'app-page-wrapper': PageWrapper
  },

  data() {
    return {
      hasMembersToMerge: false,
      hasMembers: false,
      isPageLoading: true
    }
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      integrations: 'integration/listByPlatform',
      activeView: 'member/activeView'
    }),

    hasIntegrations() {
      return !!Object.keys(this.integrations || {}).length
    },

    hasPermissionToCreate() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    },

    isCreateLockedForSampleData() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser
      ).createLockedForSampleData
    }
  },

  async created() {
    const { filter } = this.$store.state.member

    this.isPageLoading = true

    await this.doFetchIntegrations()
    await this.doFetchCustomAttributes()

    const { joinedFrom, activeFrom } = this.$route.query
    if (
      joinedFrom &&
      moment(joinedFrom, 'YYYY-MM-DD', true).isValid()
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
        value: joinedFrom
      })
    }
    if (
      activeFrom &&
      moment(activeFrom, 'YYYY-MM-DD', true).isValid()
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
        value: activeFrom
      })
      this.SORTER_CHANGED({
        activeView: this.activeView,
        sorter: {
          prop: 'activityCount',
          order: 'descending'
        }
      })
    }
    await this.doFetch({
      filter,
      keepPagination: true
    })

    const membersList = await this.doGetMembersCount()
    const mergeSuggestions =
      await MemberService.fetchMergeSuggestions(1, 0)

    this.hasMembersToMerge =
      mergeSuggestions.rows?.length > 0
    this.hasMembers = membersList.count > 0
    this.isPageLoading = false
  },

  async mounted() {
    window.analytics.page('Members')
  },

  methods: {
    ...mapMutations({
      SORTER_CHANGED: 'member/SORTER_CHANGED'
    }),
    ...mapActions({
      doFetchWidgets: 'widget/doFetch',
      doFetchCustomAttributes:
        'member/doFetchCustomAttributes',
      updateFilterAttribute: 'member/updateFilterAttribute',
      doFetch: 'member/doFetch',
      doFetchIntegrations: 'integration/doFetch'
    }),

    async doGetMembersCount() {
      try {
        const response = await MemberService.list(
          {},
          '',
          1,
          0,
          undefined,
          true
        )

        return response
      } catch (e) {
        return null
      }
    }
  }
}
</script>
