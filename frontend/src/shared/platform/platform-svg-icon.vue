<template>
  <app-platform-popover
    :username-handles="usernameHandles"
    :tooltip-label="tooltipLabel"
    :platform="platform"
    :attributes="attributes"
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
        <a
          v-if="platformConfig"
          :aria-label="platform"
          :href="href"
          target="_blank"
          rel="noopener noreferrer"
          class="min-w-[32px]"
          :class="{
            'hover:cursor-pointer': usernameHandles.length === 1 && href,
            'hover:cursor-auto': !href || usernameHandles.length > 1,
          }"
          @click.stop
        >
          <app-svg
            class="max-w-[16px] h-4"
            color="#D1D5DB"
            :name="platform"
            :hover-color="usernameHandles.length === 1 && href ? '#4B5563' : null"
          />
        </a>
        <i v-else class="ri-user-3-fill text-gray-300" />
      </div>
    </template>
  </app-platform-popover>
</template>

<script setup>
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppSvg from '@/shared/svg/svg.vue';
import AppPlatformPopover from './platform-popover.vue';

const props = defineProps({
  platform: {
    type: String,
    required: true,
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
  attributes: {
    type: Object,
    default: null,
  },
});

const platformConfig = computed(() => CrowdIntegrations.getConfig(props.platform));
const href = computed(() => (props.usernameHandles.length === 1 || props.attributes?.url?.[props.platform]
  ? CrowdIntegrations.getConfig(props.platform)?.url({ username: props.usernameHandles[0], attributes: props.attributes })
  : null));
</script>

<script>
export default {
  name: 'AppPlatformSvgIcon',
};
</script>
