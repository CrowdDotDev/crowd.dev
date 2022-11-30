<template>
  <div class="flex items-center gap-3">
    <div
      v-if="hasSocialIdentities"
      class="flex items-center gap-2"
    >
      <!-- Github -->
      <app-platform
        v-if="!!organization.github"
        platform="github"
        track-event-name="Click Organization Contact"
        track-event-channel="GitHub"
        :has-tooltip="true"
        tooltip-label="GitHub profile"
        :href="getIdentityLink('github')"
        :as-link="
          !!(
            organization['github']?.url ||
            organization['github']?.handle
          )
        "
      />

      <!-- LinkedIn -->
      <app-platform
        v-if="!!organization.linkedin"
        platform="linkedin"
        track-event-name="Click Organization Contact"
        track-event-channel="LinkedIn"
        :has-tooltip="true"
        tooltip-label="LinkedIn profile"
        :href="getIdentityLink('linkedin')"
        :as-link="
          !!(
            organization['linkedin']?.url ||
            organization['linkedin']?.handle
          )
        "
      />

      <!-- Twitter -->
      <app-platform
        v-if="!!organization.twitter"
        platform="twitter"
        track-event-name="Click Organization Contact"
        track-event-channel="Twitter"
        :has-tooltip="true"
        tooltip-label="Twitter profile"
        :href="getIdentityLink('twitter')"
        :as-link="
          !!(
            organization['twitter']?.url ||
            organization['twitter']?.handle
          )
        "
      />

      <!-- Crunchbase -->
      <app-platform
        v-if="!!organization.crunchbase"
        platform="crunchbase"
        track-event-name="Click Organization Contact"
        track-event-channel="Crunchbase"
        :has-tooltip="true"
        tooltip-label="Crunchbase profile"
        :href="getIdentityLink('crunchbase')"
        :as-link="
          !!(
            organization['crunchbase']?.url ||
            organization['crunchbase']?.handle
          )
        "
      />
    </div>

    <el-divider
      v-if="showDivider"
      direction="vertical"
      class="border-gray-200 m-0 h-8"
    />

    <div
      v-if="
        !!props.organization.emails?.length ||
        !!props.organization.phoneNumbers?.length
      "
      class="flex items-center gap-2"
    >
      <!-- Email -->
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

      <!-- Phone numbers -->
      <app-platform
        v-if="!!organization.phoneNumbers?.length"
        platform="phone"
        track-event-name="Click Organization Contact"
        track-event-channel="Phone"
        :has-tooltip="true"
        tooltip-label="Call"
        :href="
          organization.phoneNumbers?.length
            ? `tel:${organization.phoneNumbers[0]}`
            : null
        "
        :as-link="!!organization.phoneNumbers?.length"
      />
    </div>
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

const hasSocialIdentities = computed(
  () =>
    !!props.organization.github ||
    !!props.organization.linkedin ||
    !!props.organization.twitter ||
    !!props.organization.crunchbase
)
const showDivider = computed(
  () =>
    (!!props.organization.emails?.length ||
      !!props.organization.phoneNumbers?.length) &&
    hasSocialIdentities.value
)

const getIdentityLink = (platform) => {
  if (props.organization[platform]?.url) {
    return props.organization[platform]?.url
  } else if (props.organization[platform]?.handle) {
    let url

    if (platform === 'linkedin') {
      url = 'https://www.linkedin.com/'
    } else if (platform === 'github') {
      url = 'https://github.com/'
    } else if (platform === 'twitter') {
      url = 'https://twitter.com/'
    } else if (platform === 'crunchbase') {
      url = 'https://www.crunchbase.com/'
    } else {
      return null
    }

    return `${url}${props.organization[platform].handle}`
  } else {
    return null
  }
}
</script>
