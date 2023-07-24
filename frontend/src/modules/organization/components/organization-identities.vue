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
        tooltip-label="GitHub profile"
        :username-handles="[organization['github']?.handle]"
        :has-tooltip="true"
        :href="getIdentityLink('github')"
        :as-link="
          !!(
            organization['github']?.url
            || organization['github']?.handle
          )
        "
      />

      <!-- LinkedIn -->
      <app-platform
        v-if="!!organization.linkedin"
        platform="linkedin"
        track-event-name="Click Organization Contact"
        track-event-channel="LinkedIn"
        tooltip-label="LinkedIn profile"
        :username-handles="[organization['linkedin']?.handle]"
        :has-tooltip="true"
        :href="getIdentityLink('linkedin')"
        :as-link="
          !!(
            organization['linkedin']?.url
            || organization['linkedin']?.handle
          )
        "
      />

      <!-- Twitter -->
      <app-platform
        v-if="!!organization.twitter"
        platform="twitter"
        track-event-name="Click Organization Contact"
        track-event-channel="Twitter"
        tooltip-label="Twitter profile"
        :username-handles="[organization['twitter']?.handle]"
        :has-tooltip="true"
        :href="getIdentityLink('twitter')"
        :as-link="
          !!(
            organization['twitter']?.url
            || organization['twitter']?.handle
          )
        "
      />

      <!-- Crunchbase -->
      <app-platform
        v-if="!!organization.crunchbase"
        platform="crunchbase"
        track-event-name="Click Organization Contact"
        track-event-channel="Crunchbase"
        tooltip-label="Crunchbase profile"
        :username-handles="[organization['crunchbase']?.handle]"
        :has-tooltip="true"
        :href="getIdentityLink('crunchbase')"
        :as-link="
          !!(
            organization['crunchbase']?.url
            || organization['crunchbase']?.handle
          )
        "
      />

      <!-- HubSpot -->
      <app-platform
        v-if="!!organization.attributes?.url?.hubspot && !!organization.attributes?.domain?.hubspot"
        platform="hubspot"
        track-event-name="Click Organization Contact"
        track-event-channel="HubSpot"
        tooltip-label="HubSpot profile"
        :username-handles="[organization.attributes?.domain?.hubspot]"
        :has-tooltip="true"
        :href="getIdentityLink('hubspot')"
        :as-link="
          !!(
            organization.attributes?.url?.hubspot
            || organization.attributes?.domain?.hubspot
          )
        "
      />
    </div>

    <!-- Facebook -->
    <app-platform
      v-if="!!organization.facebook"
      platform="facebook"
      track-event-name="Click Organization Contact"
      track-event-channel="Facebook"
      tooltip-label="Facebook profile"
      :username-handles="[organization['facebook']?.handle]"
      :has-tooltip="true"
      :href="getIdentityLink('facebook')"
      :as-link="
        !!(
          organization['facebook']?.url
          || organization['facebook']?.handle
        )
      "
    />

    <el-divider
      v-if="showDivider"
      direction="vertical"
      class="border-gray-200 m-0 h-8"
    />

    <div
      v-if="!!props.organization.phoneNumbers?.length"
      class="flex items-center gap-2"
    >
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

<script setup>
import { withHttp } from '@/utils/string';
import { defineProps, computed } from 'vue';

const props = defineProps({
  organization: {
    type: Object,
    required: true,
  },
});

const hasSocialIdentities = computed(
  () => !!props.organization.github
    || !!props.organization.linkedin
    || !!props.organization.twitter
    || !!props.organization.crunchbase
    || !!props.organization.facebook,
);
const showDivider = computed(
  () => !!props.organization.phoneNumbers?.length
    && hasSocialIdentities.value,
);

const getIdentityLink = (platform) => {
  if (props.organization[platform]?.url) {
    return withHttp(props.organization[platform]?.url);
  }
  if (props.organization[platform]?.handle) {
    let url;

    if (platform === 'linkedin') {
      url = 'https://www.linkedin.com/company/';
    } else if (platform === 'github') {
      url = 'https://github.com/';
    } else if (platform === 'twitter') {
      url = 'https://twitter.com/';
    } else if (platform === 'crunchbase') {
      url = 'https://www.crunchbase.com/organization/';
    } else if (platform === 'facebook') {
      url = 'https://www.facebook.com/';
    } else {
      return null;
    }

    return `${url}${props.organization[platform].handle}`;
  }
  if (props.organization.attributes?.url?.[platform]) {
    return props.organization.attributes?.url?.[platform];
  }

  return null;
};
</script>

<script>
export default {
  name: 'AppOrganizationIdentities',
};
</script>
