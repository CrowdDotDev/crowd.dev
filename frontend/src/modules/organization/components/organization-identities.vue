<template>
  <div class="flex items-center gap-3">
    <div
      v-if="organization.identities.length > 0"
      class="flex items-center gap-2"
    >
      <div
        v-for="platform of platforms"
        :key="platform"
      >
        <app-platform
          :platform="platform"
          :username-handles="getHandlesByPlatform(platform)"
          :links="getUrlsByPlatform(platform)"
          :track-event-name="getPlatformDetails(platform).trackEventName"
          :track-event-channel="getPlatformDetails(platform).trackEventChannel"
          :tooltip-label="getPlatformDetails(platform).tooltipLabel"
          :show-handles-badge="true"
          :as-link="true"
        />
      </div>
      <!--      <app-platform-->
      <!--        v-for="(identity, ii) of organization.identities"-->
      <!--        :key="ii"-->
      <!--        :platform="identity.platform"-->
      <!--        track-event-name="Click Organization Contact"-->
      <!--        :track-event-channel="getPlatformDetails(identity.platform).name"-->
      <!--        :tooltip-label="`${getPlatformDetails(identity.platform).name} profile`"-->
      <!--        :username-handles="[identity.name]"-->
      <!--        :has-tooltip="true"-->
      <!--        :href="getIdentityLink(identity)"-->
      <!--        :as-link="-->
      <!--          !!(-->
      <!--            identity.url-->
      <!--            || identity.name-->
      <!--          )-->
      <!--        "-->
      <!--      />-->

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

const platforms = computed(() => [...new Set(props.organization.identities.map((i) => i.platform))]);

const getHandlesByPlatform = (platform) => props.organization.identities
  .filter((i) => i.platform === platform)
  .map((i) => i.name);
const getUrlsByPlatform = (platform) => props.organization.identities
  .filter((i) => i.platform === platform)
  .map((i) => getIdentityLink(i));

const showDivider = computed(
  () => !!props.organization.phoneNumbers?.length
    && platforms.value,
);

const getPlatformDetails = (platform) => CrowdIntegrations.getConfig(platform);

const getIdentityLink = (identity) => {
  if (identity.url) {
    return withHttp(identity.url);
  }
  return null;
};
</script>

<script>
export default {
  name: 'AppOrganizationIdentities',
};
</script>
