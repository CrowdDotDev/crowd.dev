<template>
  <div
    v-if="hasSocialIdentities || member.email"
    class="flex items-center gap-3"
  >
    <div
      v-if="hasSocialIdentities"
      class="flex gap-2 items-center"
    >
      <app-platform
        v-if="!!member.username?.twitter"
        platform="twitter"
        track-event-name="Click Member Contact"
        track-event-channel="Twitter"
        :has-tooltip="true"
        tooltip-label="Twitter profile"
        :href="member.attributes?.url?.twitter || null"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.github"
        platform="github"
        track-event-name="Click Member Contact"
        track-event-channel="GitHub"
        :has-tooltip="true"
        tooltip-label="GitHub profile"
        :href="member.attributes?.url?.github || null"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.devto"
        platform="devto"
        track-event-name="Click Member Contact"
        track-event-channel="Dev.to"
        :has-tooltip="true"
        tooltip-label="DEV profile"
        :href="member.attributes?.url?.devto || null"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.discord"
        platform="discord"
        track-event-name="Click Member Contact"
        track-event-channel="Discord"
        :has-tooltip="true"
        tooltip-label="Discord profile"
      />
      <app-platform
        v-if="!!member.username?.slack"
        platform="slack"
        track-event-name="Click Member Contact"
        track-event-channel="Slack"
        :has-tooltip="true"
        tooltip-label="Slack profile"
      />
      <app-platform
        v-if="!!member.username?.hackernews"
        platform="hackernews"
        track-event-name="Hacker News"
        :has-tooltip="true"
        tooltip-label="Hacker News profile"
        :href="`https://news.ycombinator.com/user?id=${member.username.hackernews}`"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.reddit"
        platform="reddit"
        track-event-name="Reddit"
        :has-tooltip="true"
        tooltip-label="Reddit profile"
        :href="`https://reddit.com/u/${member.username.reddit}`"
        :as-link="true"
      />
    </div>

    <el-divider
      v-if="showDivider"
      direction="vertical"
      class="border-gray-200 m-0 h-8"
    />

    <app-platform
      v-if="member.email"
      platform="email"
      track-event-name="Click Member Contact"
      track-event-channel="Email"
      :has-tooltip="true"
      tooltip-label="Send e-mail"
      :href="`mailto:${member.email}`"
      :as-link="true"
    />
  </div>
  <div v-else>-</div>
</template>

<script>
export default {
  name: 'AppMemberChannels'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  member: {
    type: Object,
    default: () => {}
  }
})

const hasSocialIdentities = computed(
  () =>
    !!props.member.username?.twitter ||
    !!props.member.username?.github ||
    !!props.member.username?.devto ||
    !!props.member.username?.discord ||
    !!props.member.username?.slack ||
    !!props.member.username?.hackernews
)
const showDivider = computed(
  () => props.member.email && hasSocialIdentities.value
)
</script>
