<template>
  <div class="flex items-center flex-wrap">
    <el-tooltip content="Send email" placement="top">
      <a
        v-if="member.email"
        :href="`mailto:${member.email}`"
        class="btn btn--circle btn--email"
        :class="member.crowdInfo ? 'mr-2' : ''"
        @click="trackClick('Email')"
        ><i class="ri-sm ri-mail-line"></i
      ></a>
    </el-tooltip>
    <div v-if="member.crowdInfo" class="flex items-center">
      <el-tooltip
        content="View Twitter Profile"
        placement="top"
      >
        <a
          v-if="member.crowdInfo.twitter"
          :href="member.crowdInfo.twitter.url"
          target="_blank"
          class="btn btn--circle btn--twitter mr-2"
          @click="trackClick('Twitter')"
        >
          <img
            :src="findIcon('twitter')"
            alt="Twitter"
            class="community-member-channels-icon"
          />
        </a>
      </el-tooltip>
      <el-tooltip
        content="View GitHub Profile"
        placement="top"
      >
        <a
          v-if="member.crowdInfo.github"
          :href="member.crowdInfo.github.url"
          target="_blank"
          class="btn btn--circle btn--github mr-2"
          @click="trackClick('GitHub')"
        >
          <img
            :src="findIcon('github')"
            alt="Github"
            class="community-member-channels-icon"
          />
        </a>
      </el-tooltip>
      <el-tooltip
        content="View LinkedIn Profile"
        placement="top"
      >
        <a
          v-if="member.crowdInfo.linkedin"
          href="https://linkedin.com"
          target="_blank"
          class="btn btn--circle btn--linkedin mr-2"
          @click="trackClick('LinkedIn')"
        >
          <img
            :src="findIcon('linkedin')"
            alt="LinkedIn"
            class="community-member-channels-icon"
          />
        </a>
      </el-tooltip>
      <el-tooltip
        v-if="member.crowdInfo.devto"
        content="View DEV Profile"
        placement="top"
      >
        <a
          :href="member.crowdInfo.devto.url"
          target="_blank"
          class="btn btn--circle btn--devto mr-2"
          @click="trackClick('Dev.to')"
        >
          <img
            :src="findIcon('devto')"
            alt="DEV"
            class="community-member-channels-icon"
          />
        </a>
      </el-tooltip>
      <span
        v-if="
          member.crowdInfo.discord &&
          member.username.discord
        "
        class="btn btn--circle btn--discord mr-2"
      >
        <img
          :src="findIcon('discord')"
          alt="Discord"
          class="community-member-channels-icon"
        />
      </span>
      <span
        v-if="
          member.crowdInfo.slack && member.username.slack
        "
        class="btn btn--circle btn--slack mr-2"
      >
        <img
          :src="findIcon('slack')"
          alt="Slack"
          class="community-member-channels-icon"
        />
      </span>
    </div>
  </div>
</template>

<script>
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'AppCommunityMemberChannels',
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    trackClick(channel) {
      window.analytics.track(
        this.member.type === 'lookalike'
          ? 'Click Lookalike Contact'
          : 'Click Member Contact',
        {
          channel
        }
      )
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
.community-member-channels-icon {
  @apply w-4 h-4;
}
</style>
