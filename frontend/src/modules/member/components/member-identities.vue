<template>
  <div
    v-if="hasSocialIdentities"
    class="flex items-center gap-3"
  >
    <div class="flex gap-2 items-center">
      <div
        v-for="platform in Object.keys(username)"
        :key="platform"
      >
        <app-platform
          v-if="username[platform].length"
          :platform="platform"
          :username-handles="username[platform]"
          :track-event-name="platformContent(platform).trackEventName"
          :track-event-channel="platformContent(platform).trackEventChannel"
          :tooltip-label="platformContent(platform).tooltipLabel"
          :as-link="platformContent(platform).asLink"
          :show-handles-badge="true"
          :backup-url="props.member.attributes.url?.[platform]"
        />
      </div>
    </div>
  </div>
  <div v-else class="text-gray-500">
    -
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  username: {
    type: Object,
    default: () => {},
  },
  member: {
    type: Object,
    default: () => {},
  },
});

const platformContent = (platform) => {
  const config = CrowdIntegrations.getConfig(platform) || {};

  return {
    trackEventName: 'Click Member Contact',
    trackEventChannel: config.name || platform,
    tooltipLabel: `${config.name || platform} profile`,
    asLink: config.showProfileLink,
  };
};

const hasSocialIdentities = computed(
  () => Object.values(props.username).some((k) => k.length > 0),
);
</script>

<script>
export default {
  name: 'AppMemberIdentities',
};
</script>
