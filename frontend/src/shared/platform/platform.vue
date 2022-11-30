<template>
  <el-tooltip
    :disabled="!tooltipLabel"
    popper-class="custom-identity-tooltip"
    placement="top"
  >
    <template #content
      ><span
        >{{ tooltipLabel }}
        <i
          v-if="href"
          class="ri-external-link-line text-gray-400"
        ></i></span
    ></template>

    <a
      v-if="asLink"
      :href="href"
      target="_blank"
      class="btn min-h-8 h-8 w-8 text-base"
      :style="{
        minWidth: '32px'
      }"
      :class="`
        ${
          href
            ? 'hover:cursor-pointer'
            : 'hover:cursor-auto'
        } ${getIconClass(platform)}`"
      @click.stop="trackClick"
    >
      <i
        v-if="platform === 'email'"
        class="ri-mail-line"
      ></i>
      <i
        v-else-if="platform === 'phone'"
        class="ri-phone-fill"
      ></i>
      <img
        v-else
        :src="imageProperties.image"
        :alt="imageProperties.name"
        class="member-channels-icon"
    /></a>

    <span
      v-else
      class="btn p-2 text-base hover:cursor-auto"
      :class="getIconClass(platform)"
      @click.stop
    >
      <i
        v-if="platform === 'email'"
        class="ri-mail-line"
      ></i>
      <i
        v-else-if="platform === 'phone'"
        class="ri-phone-fill"
      ></i>
      <img
        v-else
        :src="imageProperties.image"
        :alt="imageProperties.name"
        class="member-channels-icon"
      />
    </span>
  </el-tooltip>
</template>

<script>
export default {
  name: 'AppPlatform'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'
import { CrowdIntegrations } from '@/integrations/integrations-config'

const props = defineProps({
  platform: {
    type: String,
    required: true
  },
  trackEventChannel: {
    type: String,
    default: () => null
  },
  trackEventName: {
    type: String,
    default: () => null
  },
  hasTooltip: {
    type: Boolean,
    default: () => false
  },
  tooltipLabel: {
    type: String,
    default: () => null
  },
  href: {
    type: String,
    default: () => null
  },
  asLink: {
    type: Boolean,
    default: () => false
  }
})

const imageProperties = computed(() => {
  return CrowdIntegrations.getConfig(props.platform)
})

const trackClick = () => {
  window.analytics.track(props.trackEventName, {
    channel: props.trackEventChannel
  })
}

const getIconClass = (platform) => {
  if (platform === 'email' || platform === 'phone') {
    return 'leading-none cursor-pointer bg-white text-gray-600 hover:!text-gray-600 border border-gray-200'
  } else if (platform === 'twitter') {
    return 'btn--twitter'
  } else if (
    platform === 'github' ||
    platform === 'devto'
  ) {
    return 'bg-gray-100 border border-gray-200'
  } else if (platform === 'discord') {
    return 'btn--discord'
  } else if (
    platform === 'slack' ||
    platform === 'linkedin'
  ) {
    return 'bg-white border border-gray-200'
  } else if (platform === 'crunchbase') {
    return 'btn--crunchbase'
  }
}
</script>

<style lang="scss">
.member-channels-icon {
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
