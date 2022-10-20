<template>
  <app-page-wrapper>
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
              v-if="hasPermissionToCreate"
              :to="{
                name: 'memberCreate'
              }"
            >
              <el-button class="btn btn--primary btn--md">
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
      <app-member-list-filter></app-member-list-filter>
      <app-member-list-table></app-member-list-table>
    </div>
  </app-page-wrapper>
</template>

<script>
import { MemberService } from '../member-service'
import MemberListFilter from '@/modules/member/components/list/member-list-filter.vue'
import MemberListTable from '@/modules/member/components/list/member-list-table.vue'
import MemberListTabs from '@/modules/member/components/list/member-list-tabs.vue'
import PageWrapper from '@/modules/layout/components/page-wrapper.vue'
import { mapGetters, mapActions } from 'vuex'
import { MemberPermissions } from '../member-permissions'

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
      hasMembersToMerge: false
    }
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      integrations: 'integration/listByPlatform'
    }),

    hasPermissionToCreate() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    }
  },

  async created() {
    const mergeSuggestions =
      await MemberService.fetchMergeSuggestions()
    this.hasMembersToMerge = mergeSuggestions.length > 0
  },

  async mounted() {
    window.analytics.page('Members')
  },

  methods: {
    ...mapActions({
      doFetchWidgets: 'widget/doFetch'
    })
  }
}
</script>
