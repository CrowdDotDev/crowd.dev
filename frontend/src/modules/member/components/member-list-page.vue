<template>
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

          <el-button
            v-if="hasPermissionToCreate"
            class="btn btn--primary btn--md"
            @click.prevent="creating = true"
          >
            Add member
          </el-button>
        </div>
      </div>
      <div class="text-xs text-gray-500">
        Overview of all members from your community
      </div>
    </div>

    <el-dialog
      v-model="creating"
      title="New Member"
      :append-to-body="true"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="creating = false"
    >
      <app-member-form-page @cancel="creating = false">
      </app-member-form-page>
    </el-dialog>

    <app-member-tabs></app-member-tabs>
    <app-member-list-filter></app-member-list-filter>
    <app-member-list-table></app-member-list-table>
  </div>
</template>

<script>
import { MemberService } from '../member-service'
import MemberListFilter from '@/modules/member/components/member-list-filter.vue'
import MemberListTable from '@/modules/member/components/member-list-table.vue'
import MemberFormPage from '@/modules/member/components/member-form-page.vue'
import MemberTabs from '@/modules/member/components/member-tabs.vue'
import { mapGetters, mapActions } from 'vuex'
import { MemberPermissions } from '../member-permissions'

export default {
  name: 'AppMemberListPage',

  components: {
    'app-member-list-filter': MemberListFilter,
    'app-member-list-table': MemberListTable,
    'app-member-form-page': MemberFormPage,
    'app-member-tabs': MemberTabs
  },

  data() {
    return {
      creating: false,
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
