<template>
  <app-platform-popover
    :username-handles="usernameHandles"
    :tooltip-label="tooltipLabel"
    :platform="platform"
    :href="asLink ? href : null"
    :links="props.links"
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
        <el-tooltip
          :disabled="!showTooltip || imageProperties || platform === 'email' || platform === 'phone'"
          :content="platform"
          placement="top"
        >
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
              v-else-if="imageProperties"
              :src="imageProperties.image"
              :alt="imageProperties.name"
              class="channels-icon"
            />
            <i v-else :class="props.customPlatformIconClass" />
          </component>
        </el-tooltip>
      </div>
    </template>
  </app-platform-popover>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
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
  links: {
    type: Array,
    default: () => [],
  },
  showHandlesBadge: {
    type: Boolean,
    default: false,
  },
  showTooltip: {
    type: Boolean,
    default: false,
  },
  href: {
    type: String,
    default: null,
  },
  backupUrl: {
    type: String,
    default: null,
  },
  customPlatformIconClass: {
    type: String,
    default: 'ri-user-3-fill',
  },
});

const imageProperties = computed(() => CrowdIntegrations.getConfig(props.platform));
const href = computed(() => {
  if (props.href) {
    return props.href;
  }

  return (props.usernameHandles.length === 1
    ? (CrowdIntegrations.getConfig(props.platform)?.url(props.usernameHandles[0]) ?? props.backupUrl) : null);
});

const trackClick = () => {
  window.analytics.track(props.trackEventName, {
    channel: props.trackEventChannel,
  });
};

const getIconClass = (platform) => {
  if (!CrowdIntegrations.getConfig(platform)) {
    return 'btn--custom-platform';
  }

  return `btn--${platform}`;
};
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
