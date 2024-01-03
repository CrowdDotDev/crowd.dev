<template>
  <app-platform-list-popover
    :platform-handles-links="platformHandlesLinks"
    :platform="platform"
  >
    <template #platform>
      <div class="relative flex items-center justify-center">
        <component
          :is="asLink ? 'a' : 'span'"
          :href="asLink ? platformHandlesLinks[0].link ?? null : null"
          target="_blank"
          rel="noopener noreferrer"
          class="btn flex items-center justify-center"
          :class="{
            'hover:cursor-auto': !asLink,
            'hover:cursor-pointer': asLink,
            'min-h-4 min-w-[16px] h-4 w-4': size === 'small',
            'min-h-5 min-w-[20px] h-5 w-5': size !== 'small',
          }"
          @click.stop="trackClick"
        >
          <app-platform-svg
            v-if="asSvg"
            :platform="platform"
            :size="size"
            :as-link="asLink"
          />
          <app-platform-img
            v-else-if="defaultPlatformConfig"
            :platform="platform"
            :size="size"
          />
          <app-platform-icon
            v-else
            :platform="platform"
            :size="size"
          />
        </component>
      </div>
    </template>
  </app-platform-list-popover>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { toSentenceCase } from '@/utils/string';
import AppPlatformIcon from '@/shared/platform/platform-icon/platform-icon.vue';
import AppPlatformListPopover from '@/shared/platform/platform-list-popover.vue';
import AppPlatformSvg from '@/shared/platform/platform-icon/platform-svg.vue';
import AppPlatformImg from '@/shared/platform/platform-icon/platform-img.vue';

const props = withDefaults(defineProps<{
    platform: string;
    size: string;
    platformHandlesLinks?: {
      handle: string;
      link: string;
    }[];
    appModule?: string;
    asLink?: boolean;
    asSvg?: boolean;
}>(), {
  platformHandlesLinks: () => [],
  appModule: 'member',
  asSvg: false,
  size: 'small',
  asLink: true,
});

const defaultPlatformConfig = computed(() => CrowdIntegrations.getConfig(props.platform));

const trackingContent = () => ({
  name: `Click ${props.appModule === 'member' ? 'Contact\'s' : 'Organization\'s'} Contact`,
  channel: defaultPlatformConfig.value?.name || toSentenceCase(props.platform),
});

const trackClick = () => {
  if (!props.asLink) {
    return;
  }

  const { name, channel } = trackingContent();

  (window as any).analytics.track(name, {
    channel,
  });
};
</script>

<script lang="ts">
export default {
  name: 'AppPlatform',
};
</script>

<style lang="scss">
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
