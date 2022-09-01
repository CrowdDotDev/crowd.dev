<template>
  <div class="community-member-list-page">
    <h1 class="app-content-title">
      <app-i18n
        code="entities.communityMember.list.title"
      ></app-i18n>
    </h1>
    <div
      v-if="hasMembersToMerge"
      class="border p-4 mb-4 rounded-lg border-secondary-900 bg-secondary-50"
    >
      <div class="flex items-start">
        <i
          class="ri-information-fill mr-4 ri-xl flex items-center pt-1 text-secondary-900"
        ></i>
        <div class="text-sm">
          <div class="font-semibold mb-1">
            Suggestion: Merge community members
          </div>
          <div>
            We've found some community members that seem to
            be the same person, which should be merged into
            a single profile.
            <br />
            Click
            <router-link
              :to="{
                name: 'communityMemberMergeSuggestions'
              }"
              class="font-semibold"
              >here</router-link
            >
            to look into these suggestions.
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-4">
      <app-community-member-platform-tabs />
      <div class="flex items-center justify-end">
        <div
          id="teleport-community-member-filter-toggle"
        ></div>

        <el-button
          v-if="hasPermissionToCreate"
          class="btn btn--primary ml-2"
          @click.prevent="creating = true"
        >
          <i class="ri-lg ri-add-line mr-1" />
          <app-i18n code="common.new"></app-i18n>
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="creating"
      title="New Member"
      :append-to-body="true"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="creating = false"
    >
      <app-community-member-form-page
        @cancel="creating = false"
      >
      </app-community-member-form-page>
    </el-dialog>

    <app-community-member-list-filter></app-community-member-list-filter>
    <app-community-member-list-table></app-community-member-list-table>
  </div>
</template>

<script>
import { CommunityMemberService } from '../community-member-service'
import CommunityMemberListFilter from '@/modules/community-member/components/community-member-list-filter.vue'
import CommunityMemberListTable from '@/modules/community-member/components/community-member-list-table.vue'
import CommunityMemberFormPage from '@/modules/community-member/components/community-member-form-page.vue'
import CommunityMemberPlatformTabs from '@/modules/community-member/components/community-member-platform-tabs.vue'
import { mapGetters, mapActions } from 'vuex'
import { CommunityMemberPermissions } from '../community-member-permissions'

export default {
  name: 'AppCommunityMemberListPage',

  components: {
    'app-community-member-list-filter':
      CommunityMemberListFilter,
    'app-community-member-list-table':
      CommunityMemberListTable,
    'app-community-member-form-page':
      CommunityMemberFormPage,
    'app-community-member-platform-tabs':
      CommunityMemberPlatformTabs
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
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    }
  },

  async created() {
    const mergeSuggestions =
      await CommunityMemberService.fetchMergeSuggestions()
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
