<template>
  <app-widget v-if="widget" :config="config">
    <div class="widget-newest-members">
      <div v-if="rows.length > 0">
        <div
          v-for="(date, index) in Object.keys(
            membersByDate
          )"
          :key="index"
          class="mb-6"
        >
          <span
            class="block text-xs text-gray-500 uppercase"
            >joined {{ timeAgo(date) }}</span
          >
          <div class="flex flex-wrap items-center relative">
            <div
              v-for="member in Object.values(
                membersByDate[date]
              )"
              :key="member.id"
              class="member"
            >
              <router-link
                :to="{
                  name: 'communityMemberView',
                  params: { id: member.id }
                }"
              >
                <app-avatar
                  :entity="member"
                  size="sm"
                  class="mb-1"
                ></app-avatar>
              </router-link>
              <div class="ml-2">
                <router-link
                  class="block text-black"
                  :to="{
                    name: 'communityMemberView',
                    params: { id: member.id }
                  }"
                >
                  <div class="block leading-none">
                    <span class="block text-sm">{{
                      member.username.crowdUsername
                    }}</span>
                  </div>
                </router-link>
                <div
                  class="flex leading-none text-base pt-1"
                >
                  <el-tooltip
                    v-if="member.crowdInfo.github"
                    content="GitHub"
                    placement="top"
                  >
                    <a
                      :href="member.crowdInfo.github.url"
                      target="_blank"
                      class="mr-1"
                    >
                      <img
                        :src="findIcon('github')"
                        alt="Github"
                        class="platform-icon"
                      />
                    </a>
                  </el-tooltip>

                  <el-tooltip
                    v-if="member.crowdInfo.twitter"
                    content="Twitter"
                    placement="top"
                  >
                    <a
                      :href="member.crowdInfo.twitter.url"
                      target="_blank"
                    >
                      <img
                        :src="findIcon('twitter')"
                        alt="Twitter"
                        class="platform-icon"
                      />
                    </a>
                  </el-tooltip>

                  <el-tooltip
                    v-if="member.crowdInfo.discord"
                    content="Discord"
                    placement="top"
                  >
                    <a
                      v-if="member.crowdInfo.discord"
                      :href="
                        member.crowdInfo.discord.html_url
                      "
                      target="_blank"
                    >
                      <img
                        :src="findIcon('discord')"
                        alt="Discord"
                        class="platform-icon"
                      />
                    </a>
                  </el-tooltip>

                  <el-tooltip
                    v-if="member.crowdInfo.slack"
                    content="Slack"
                    placement="top"
                  >
                    <a
                      v-if="member.crowdInfo.slack"
                      :href="
                        member.crowdInfo.slack.html_url
                      "
                      target="_blank"
                    >
                      <img
                        :src="findIcon('slack')"
                        alt="Slack"
                        class="platform-icon"
                      />
                    </a>
                  </el-tooltip>

                  <el-tooltip
                    v-if="member.crowdInfo.devto"
                    content="DEV"
                    placement="top"
                  >
                    <a
                      :href="member.crowdInfo.devto.url"
                      target="_blank"
                    >
                      <img
                        :src="findIcon('devto')"
                        alt="DEV"
                        class="platform-icon"
                      />
                    </a>
                  </el-tooltip>

                  <el-tooltip
                    v-if="member.crowdInfo.apis"
                    content="API"
                    placement="top"
                  >
                    <div
                      v-if="member.crowdInfo.apis"
                      class="text-sm leading-none h-5 tracking-tighter text-gray-400 hover:text-gray-800 font-semibold"
                    >
                      API
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex items-center justify-center text-sm text-gray-400 h-full"
      >
        No data
      </div>
    </div>
  </app-widget>
</template>

<script>
import Widget from '../widget'
import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import { mapGetters } from 'vuex'
import moment from 'moment'
import computedTimeAgo from '@/utils/time-ago'
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'AppWidgetNewestMembers',
  components: {
    'app-widget': Widget
  },
  computed: {
    ...mapGetters({
      widgetFindByType: 'widget/findByType'
    }),
    widget() {
      return this.widgetFindByType('newest-members')
    },
    config() {
      return {
        id: this.widget ? this.widget.id : null,
        type: this.widget.type,
        title: 'Newest Members',
        rows: this.rows,
        loading: this.loading,
        link: { name: 'communityMember' },
        linkLabel: 'View all'
      }
    },
    membersByDate() {
      return this.rows.reduce((acc, item) => {
        const joinedAt = moment(item.joinedAt).format(
          'YYYY-MM-DD'
        )
        if (!(joinedAt in acc)) {
          acc[joinedAt] = [item]
        } else {
          acc[joinedAt].push(item)
        }
        return acc
      }, {})
    }
  },
  data() {
    return {
      rows: [],
      loading: false
    }
  },
  async created() {
    this.loading = true
    const response = await CommunityMemberService.list(
      { type: 'member' },
      'joinedAt_DESC',
      15,
      null
    )
    this.rows = response.rows
    this.loading = false
  },
  methods: {
    timeAgo(date) {
      return computedTimeAgo(date)
    },
    findIcon(platform) {
      return integrationsJsonArray.find(
        (p) => p.platform === platform
      ).image
    }
  }
}
</script>

<style lang="scss">
.widget-newest-members {
  @apply h-72 -mb-4 overflow-auto;

  .member {
    @apply w-full h-10 flex items-center my-4 text-black;
    max-width: 33.33%;
    @media only screen and (min-width: 1800px) {
      max-width: 25%;
    }
  }

  .platform-icon {
    @apply mr-1 w-4 h-4 opacity-60;
    filter: grayscale(100%);

    &:hover {
      @apply opacity-100;
      filter: none;
    }
  }
}
</style>
