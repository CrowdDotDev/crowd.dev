<template>
  <app-platform-popover
    :username-handles="usernameHandles"
    :tooltip-label="tooltipLabel"
    :platform="platform"
    :href="asLink ? href : null"
  >
    <template #platform>
      <div class="relative">
        <div
          v-if="showHandlesBadge && usernameHandles.length > 1"
          class="w-3.5 h-3.5 rounded-full bg-gray-500 text-white flex justify-center
        items-center outline outline-2 outline-white absolute top-[-7px] right-[-7px]"
        >
          <span class="text-3xs font-semibold">{{ usernameHandles.length }}</span>
        </div>
        <component
          :is="asLink ? 'a' : 'span'"
          :href="href"
          target="_blank"
          rel="noopener noreferrer"
          class="btn min-h-8 min-w-[32px] h-8 w-8 text-base"
          :class="`
        ${
            !asLink || !href
              ? 'hover:cursor-auto'
              : 'hover:cursor-pointer'
          } ${getIconClass(platform)}`"
          @click.stop="asLink ? trackClick : null"
        >
          <i
            v-if="platform === 'email'"
            class="ri-mail-line"
          />
          <i
            v-else-if="platform === 'phone'"
            class="ri-phone-fill"
          />
          <img
            v-else
            :src="imageProperties.image"
            :alt="imageProperties.name"
            class="channels-icon"
          />
        </component>
      </div>
    </template>
  </app-platform-popover>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { getPlatformUrl } from '@/utils/string';
import AppPlatformPopover from './platform-popover.vue';

const props = defineProps({
  platform: {
    type: String,
    required: true,
  },
  trackEventChannel: {
    type: String,
    default: () => null,
  },
  trackEventName: {
    type: String,
    default: () => null,
  },
  tooltipLabel: {
    type: String,
    default: () => null,
  },
  asLink: {
    type: Boolean,
    default: () => false,
  },
  usernameHandles: {
    type: Array,
    default: () => [],
  },
  showHandlesBadge: {
    type: Boolean,
    default: false,
  },
});

const imageProperties = computed(() => CrowdIntegrations.getConfig(props.platform));
const href = computed(() => (props.usernameHandles.length === 1 ? getPlatformUrl({
  platform: props.platform,
  username: props.usernameHandles[0],
}) : null));

const trackClick = () => {
  window.analytics.track(props.trackEventName, {
    channel: props.trackEventChannel,
  });
};

const getIconClass = (platform) => `btn--${platform}`;
</script>

<script>
export default {
  name: 'AppPlatform',
};
</script>

<style lang="scss">
.channels-icon {
  max-height: 1rem;
}

// Custom tooltip for external links
.custom-identity-tooltip {
  span:first-child {
    @apply flex gap-1.5 items-center;
  }
}

a[href]:hover {
  opacity: 1;
}
</style>
