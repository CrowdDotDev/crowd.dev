<template>
  <div class="flex items-center gap-2">
    <app-platform
      v-if="member.email"
      platform="email"
      track-event-name="Email"
      :has-tooltip="true"
      tooltip-label="Send e-mail"
      :href="`mailto:${member.email}`"
      :as-link="true"
    />
    <div class="flex gap-2 items-center">
      <app-platform
        v-if="!!member.username?.twitter"
        platform="twitter"
        track-event-name="Twitter"
        :has-tooltip="true"
        tooltip-label="Twitter profile"
        :href="member.attributes?.url?.twitter || null"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.github"
        platform="github"
        track-event-name="GitHub"
        :has-tooltip="true"
        tooltip-label="GitHub profile"
        :href="member.attributes?.url?.github || null"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.devto"
        platform="devto"
        track-event-name="Dev.to"
        :has-tooltip="true"
        tooltip-label="DEV profile"
        :href="member.attributes?.url?.devto || null"
        :as-link="true"
      />
      <app-platform
        v-if="!!member.username?.discord"
        platform="discord"
        track-event-name="Discord"
        :has-tooltip="true"
        tooltip-label="Discord profile"
      />
      <app-platform
        v-if="!!member.username?.slack"
        platform="slack"
        track-event-name="Slack"
        :has-tooltip="true"
        tooltip-label="Slack profile"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberChannels',
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  }
}
</script>
