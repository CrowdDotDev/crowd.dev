<template>
  <div class="flex items-center gap-3">
    <div
      v-if="hasSocialIdentities"
      class="flex items-center gap-2"
    >
      <!-- Github -->
      <app-platform
        v-if="organization.identities.includes('github')"
        platform="github"
        track-event-name="Click Organization Contact"
        track-event-channel="GitHub"
        :has-tooltip="true"
        tooltip-label="GitHub profile"
        :href="
          organization['github']?.handle
            ? `https://github.com/${organization['github']?.handle}`
            : null
        "
        :as-link="!!organization['github']?.handle"
      />

      <!-- LinkedIn -->
      <app-platform
        v-if="organization.identities.includes('linkedin')"
        platform="linkedin"
        track-event-name="Click Organization Contact"
        track-event-channel="LinkedIn"
        :has-tooltip="true"
        tooltip-label="LinkedIn profile"
        :href="
          organization['linkedin']?.handle
            ? `https://www.linkedin.com/${organization['linkedin']?.handle}`
            : null
        "
        :as-link="!!organization['linkedin']?.handle"
      />

      <!-- Twitter -->
      <app-platform
        v-if="organization.identities.includes('twitter')"
        platform="twitter"
        track-event-name="Click Organization Contact"
        track-event-channel="Twitter"
        :has-tooltip="true"
        tooltip-label="Twitter profile"
        :href="
          organization['twitter']?.handle
            ? `https://twitter.com/${organization['twitter']?.handle}`
            : null
        "
        :as-link="!!organization['twitter']?.handle"
      />

      <!-- Crunchbase -->
      <app-platform
        v-if="
          organization.identities.includes('crunchbase')
        "
        platform="crunchbas"
        track-event-name="Click Organization Contact"
        track-event-channel="Crunchbase"
        :has-tooltip="true"
        tooltip-label="Crunchbase profile"
        :href="
          organization['crunchbase']?.handle
            ? `https://www.crunchbase.com/${organization['crunchbase']?.handle}`
            : null
        "
        :as-link="!!organization['crunchbase']?.handle"
      />
    </div>

    <el-divider
      v-if="showDivider"
      direction="vertical"
      class="border-gray-200 m-0 h-8"
    />

    <app-platform
      v-if="!!organization.emails?.length"
      platform="email"
      track-event-name="Click Organization Contact"
      track-event-channel="Email"
      :has-tooltip="true"
      tooltip-label="Send e-mail"
      :href="
        organization.emails?.length
          ? `mailto:${organization.emails[0]}`
          : null
      "
      :as-link="!!organization.emails?.length"
    />
  </div>
</template>

<script>
export default {
  name: 'AppOrganizationIdentities'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
})

const hasSocialIdentities = computed(() =>
  props.organization.identities.some(
    (i) =>
      i === 'github' ||
      i === 'linkedin' ||
      i === 'twitter' ||
      i === 'crunchbase'
  )
)
const showDivider = computed(
  () =>
    !!props.organization.emails?.length &&
    hasSocialIdentities.value
)
</script>
