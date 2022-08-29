<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner mt-16"
    ></div>
    <div v-else class="flex flex-wrap lg:flex-nowrap -mx-3">
      <div
        class="w-full lg:max-w-sm px-3 community-member-view flex-shrink-0"
      >
        <h1 class="app-content-title">View Member</h1>
        <app-community-member-details
          :member="record"
          @updated="doRefresh"
        />
      </div>
      <div class="flex-grow px-3 pt-12">
        <app-activity-platform-tabs
          :is-member="true"
          class="inline-block mb-4"
          @change="handleActivityPlatformChange"
        />
        <div v-if="userActivities.length > 0">
          <app-activity-list-feed-item
            v-for="activity in userActivities"
            :key="activity.id"
            :activity="activity"
          ></app-activity-list-feed-item>
        </div>
        <div
          v-else
          class="text-sm text-gray-600 text-center"
        >
          <span v-if="activityPlatform"
            >This member has no activities in this channel
            yet.</span
          >
          <span v-else
            >This member has no activities yet.</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'
import CommunityMemberDetails from './community-member-details'
import ActivityListFeedItem from '@/modules/activity/components/activity-list-feed-item'
import AppActivityPlatformTabs from '../../activity/components/activity-platform-tabs'

export default {
  name: 'AppCommunityMemberViewPage',

  components: {
    AppActivityPlatformTabs,
    'app-activity-list-feed-item': ActivityListFeedItem,
    'app-community-member-details': CommunityMemberDetails
  },

  props: ['id'],

  data() {
    return {
      activityPlatform: null
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm',
      record: 'communityMember/view/record',
      loading: 'communityMember/view/loading'
    }),

    hasPermissionToEdit() {
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToDestroy() {
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).destroy
    },

    userActivities() {
      return this.record.activities
        .filter((a) => {
          return this.activityPlatform
            ? a.platform === this.activityPlatform
            : true
        })
        .map((a) => {
          return Object.assign({}, a, {
            communityMember: this.record
          })
        })
    }
  },

  async created() {
    await this.doFind(this.id)
  },

  mounted() {
    if (this.record) {
      window.analytics.page(
        this.record.type === 'lookalike'
          ? 'Lookalike — View'
          : 'Members — View'
      )
    }
  },

  methods: {
    ...mapActions({
      doFind: 'communityMember/view/doFind'
    }),
    doRefresh() {
      this.doFind(this.id)
    },
    handleActivityPlatformChange(value) {
      this.activityPlatform = value
    }
  }
}
</script>

<style lang="scss">
.community-member-view {
  /* TODO: Find a better way to handle this
  @media only screen and (min-width: 1024px) {
    & {
      @apply sticky top-0 self-start;
    }
  }*/
}
</style>
