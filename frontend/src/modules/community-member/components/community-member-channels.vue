<template>
  <div class="flex items-center flex-wrap">
    <el-tooltip content="Send email" placement="top">
      <a
        :href="`mailto:${member.email}`"
        v-if="member.email"
        class="btn btn--circle btn--email"
        :class="member.crowdInfo ? 'mr-2' : ''"
        @click="trackClick('Email')"
        ><i class="ri-sm ri-mail-line"></i
      ></a>
    </el-tooltip>
    <div class="flex items-center" v-if="member.crowdInfo">
      <el-tooltip
        content="View Twitter Profile"
        placement="top"
      >
        <a
          :href="member.crowdInfo.twitter.url"
          v-if="member.crowdInfo.twitter"
          @click="trackClick('Twitter')"
          target="_blank"
          class="btn btn--circle btn--twitter mr-2"
          ><i class="ri-sm ri-twitter-fill"></i
        ></a>
      </el-tooltip>
      <el-tooltip
        content="View GitHub Profile"
        placement="top"
      >
        <a
          :href="member.crowdInfo.github.url"
          v-if="member.crowdInfo.github"
          @click="trackClick('GitHub')"
          target="_blank"
          class="btn btn--circle btn--github mr-2"
          ><i class="ri-github-fill"></i
        ></a>
      </el-tooltip>
      <el-tooltip
        content="View LinkedIn Profile"
        placement="top"
      >
        <a
          href="https://linkedin.com"
          @click="trackClick('LinkedIn')"
          v-if="member.crowdInfo.linkedin"
          target="_blank"
          class="btn btn--circle btn--linkedin mr-2"
          ><i class="ri-linkedin-fill"></i
        ></a>
      </el-tooltip>
      <span
        v-if="
          member.crowdInfo.discord &&
          member.username.discord
        "
        class="btn btn--circle btn--discord mr-2"
        ><i class="ri-discord-fill"></i
      ></span>
      <span
        v-if="
          member.crowdInfo.slack && member.username.slack
        "
        class="btn btn--circle btn--slack mr-2"
        ><i class="ri-slack-line"></i
      ></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-community-member-channels',
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
    }
  }
}
</script>
