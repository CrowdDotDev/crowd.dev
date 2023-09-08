<template>
  <div class="flex items-center gap-3">
    <div
      v-if="organization.identities.length > 0"
      class="flex items-center gap-2"
    >
      <!-- Github -->
      <app-platform
        v-for="(identity, ii) of organization.identities"
        :key="ii"
        :platform="identity.platform"
        track-event-name="Click Organization Contact"
        :track-event-channel="getPlatformDetails(identity.platform).name"
        :tooltip-label="`${getPlatformDetails(identity.platform).name} profile`"
        :username-handles="[identity.name]"
        :has-tooltip="true"
        :href="getIdentityLink(identity)"
        :as-link="
          !!(
            identity.url
            || identity.name
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
  </div>
</template>

<script setup>
import { withHttp } from '@/utils/string';
import { defineProps, computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  organization: {
    type: Object,
    required: true,
  },
});

const showDivider = computed(
  () => !!props.organization.phoneNumbers?.length
    && hasSocialIdentities.value,
);

const getPlatformDetails = (platform) => CrowdIntegrations.getConfig(platform);

const getIdentityLink = (identity) => {
  if (identity.url) {
    return withHttp(identity.url);
  }
  if (identity.name) {
    let url;

    if (identity.platform === 'linkedin') {
      url = 'https://www.linkedin.com/company';
    } else if (identity.platform === 'github') {
      url = 'https://github.com/';
    } else if (identity.platform === 'twitter') {
      url = 'https://twitter.com/';
    } else if (identity.platform === 'crunchbase') {
      url = 'https://www.crunchbase.com/organization/';
    } else if (identity.platform === 'facebook') {
      url = 'https://www.facebook.com/';
    } else {
      return null;
    }

    return `${url}${identity.name}`;
  }
  return null;
};
</script>

<script>
export default {
  name: 'AppOrganizationIdentities',
};
</script>
