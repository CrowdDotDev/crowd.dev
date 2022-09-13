<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner mt-16"
    ></div>
    <div v-else>
      <div class="community-member-merge">
        <div class="flex justify-between items-center">
          <h1 class="app-content-title">
            Merge Community Members
          </h1>
          <div class="flex items-center">
            <el-tooltip
              content="Please select a member to merge"
              placement="top"
              :disabled="memberToMerge !== null"
            >
              <div>
                <el-button
                  class="btn btn--primary mr-4"
                  :disabled="memberToMerge === null"
                  :loading="loadingSubmit"
                  @click="handleMergeSubmit"
                >
                  <i
                    v-if="!loadingSubmit"
                    class="ri-lg ri-group-line mr-2"
                  ></i>
                  <span>Merge Members</span>
                </el-button>
              </div>
            </el-tooltip>
            <router-link
              :to="computedBackLink"
              class="btn btn--secondary"
            >
              <i class="ri-lg ri-close-line mr-2"></i>
              <span>Cancel</span>
            </router-link>
          </div>
        </div>
        <div class="flex -mx-3 pt-8">
          <div class="w-full lg:w-1/2 px-3">
            <span class="font-semibold block mb-2"
              >Member to keep</span
            >
            <app-community-member-details
              :member="record"
              :show-dropdown="false"
            ></app-community-member-details>
            <span class="block font-semibold mt-8 mb-2"
              >Activities</span
            >
            <div v-if="activitiesMemberToKeep.length > 0">
              <app-activity-list-feed-item
                v-for="activity in activitiesMemberToKeep"
                :key="activity.id"
                :activity="activity"
              ></app-activity-list-feed-item>
              <div class="text-center">
                <el-button
                  v-if="hasMoreActivitiesMemberToKeep"
                  type="text"
                  @click="maxActivitiesMemberToKeep += 5"
                  >Show more activities</el-button
                >
              </div>
            </div>
            <div v-else class="text-sm text-gray-600">
              This member has no activities yet.
            </div>
          </div>
          <div class="w-full lg:w-1/2 px-3">
            <div>
              <transition name="fade" mode="in-out">
                <div v-if="memberToMerge">
                  <div
                    class="flex items-center justify-between mb-2"
                  >
                    <span class="font-semibold block"
                      >Member to merge</span
                    >
                    <button
                      v-if="memberToMerge !== null"
                      class="inline-flex items-center text-brand-500 text-sm"
                      @click="memberToMerge = null"
                    >
                      <i
                        class="ri-lg ri-refresh-line mr-2"
                      ></i>
                      <span class="hover:underline"
                        >Switch member</span
                      >
                    </button>
                  </div>
                  <app-community-member-details
                    :member="memberToMerge"
                    :show-dropdown="false"
                  ></app-community-member-details>
                  <span
                    class="block font-semibold mt-8 mb-2"
                    >Activities</span
                  >
                  <div
                    v-if="
                      activitiesMemberToMerge.length > 0
                    "
                  >
                    <app-activity-list-feed-item
                      v-for="activity in activitiesMemberToMerge"
                      :key="activity.id"
                      :activity="activity"
                    ></app-activity-list-feed-item>
                    <div class="text-center">
                      <el-button
                        v-if="
                          hasMoreActivitiesMemberToMerge
                        "
                        type="text"
                        @click="
                          maxActivitiesMemberToMerge += 5
                        "
                        >Show more activities</el-button
                      >
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-600">
                    This member has no activities yet.
                  </div>
                </div>
                <div v-else-if="loadingMemberToMerge">
                  <div
                    v-loading="loadingMemberToMerge"
                    class="app-page-spinner mt-16"
                  ></div>
                </div>
                <div v-else class="pt-9">
                  <span
                    class="text-sm text-gray-600 mb-2 block"
                    >Please search and select the member you
                    want to merge.</span
                  >
                  <app-community-member-autocomplete-input
                    v-model="computedMemberToMerge"
                    :fetch-fn="fetchFn"
                    placeholder="Type to search member"
                    input-class="w-full"
                    mode="single"
                  ></app-community-member-autocomplete-input>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { i18n } from '@/i18n'
import CommunityMemberDetails from './community-member-details'
import CommunityMemberAutocompleteInput from './community-member-autocomplete-input'
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'
import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import ActivityListFeedItem from '@/modules/activity/components/activity-list-feed-item'

const { fields } = CommunityMemberModel

export default {
  name: 'AppCommunityMemberMergePage',

  components: {
    'app-community-member-details': CommunityMemberDetails,
    'app-community-member-autocomplete-input':
      CommunityMemberAutocompleteInput,
    'app-activity-list-feed-item': ActivityListFeedItem
  },

  props: {
    id: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      memberToMerge: null,
      fromSuggestion: false,
      loadingMemberToMerge: false,
      loadingSubmit: false,
      maxActivitiesMemberToKeep: 5,
      maxActivitiesMemberToMerge: 5
    }
  },

  computed: {
    ...mapGetters({
      record: 'communityMember/view/record',
      loading: 'communityMember/view/loading'
    }),

    fields() {
      return fields
    },

    computedMemberToMerge: {
      get() {
        return this.memberToMerge
      },
      async set(value) {
        this.loadingMemberToMerge = true
        this.memberToMerge =
          await CommunityMemberService.find(value.id)
        await this.$router.push({
          name: 'communityMemberMerge',
          query: { idToMerge: value ? value.id : undefined }
        })
        this.loadingMemberToMerge = false
      }
    },

    computedBackLink() {
      return {
        name: this.fromSuggestion
          ? 'communityMemberMergeSuggestions'
          : 'communityMember'
      }
    },

    activitiesMemberToKeep() {
      return this.record.activities
        .map((a) => {
          return Object.assign({}, a, {
            communityMember: this.record
          })
        })
        .slice(0, this.maxActivitiesMemberToKeep)
    },
    activitiesMemberToMerge() {
      return this.memberToMerge.activities
        .map((a) => {
          return Object.assign({}, a, {
            communityMember: this.memberToMerge
          })
        })
        .slice(0, this.maxActivitiesMemberToKeep)
    },

    hasMoreActivitiesMemberToKeep() {
      return (
        this.record.activities.length >
        this.maxActivitiesMemberToKeep
      )
    },

    hasMoreActivitiesMemberToMerge() {
      return (
        this.memberToMerge.activities.length >
        this.maxActivitiesMemberToMerge
      )
    }
  },

  async created() {
    await this.doFind(this.id)

    const urlSearchParams = new URLSearchParams(
      window.location.search
    )
    const params = Object.fromEntries(
      urlSearchParams.entries()
    )

    if (params['fromSuggestion']) {
      this.fromSuggestion = true
    }

    if (params['idToMerge']) {
      this.loadingMemberToMerge = true
      this.memberToMerge =
        await CommunityMemberService.find(
          params['idToMerge']
        )
      this.loadingMemberToMerge = false
    }
  },

  methods: {
    ...mapActions({
      doFind: 'communityMember/view/doFind',
      doMerge: 'communityMember/list/doMerge'
    }),

    async fetchFn(query, limit) {
      const options =
        await CommunityMemberService.listAutocomplete(
          query,
          limit
        )
      return options.filter((m) => {
        return m.id !== this.id
      })
    },

    async handleMergeSubmit() {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        this.loadingSubmit = true

        await this.doMerge({
          memberToKeep: this.record,
          memberToMerge: this.memberToMerge
        })
      } catch (error) {
        this.loadingSubmit = false
      }
    }
  }
}
</script>

<style lang="scss">
.community-member-merge {
  .app-content-title {
    @apply mb-0;
  }
}
</style>
