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
      class="btn p-2 text-base"
      :class="`
        ${
          href
            ? 'hover:cursor-pointer'
            : 'hover:cursor-auto'
        } ${getIconClass(platform)}`"
      @click.stop="trackClick(platformName)"
    >
      <i
        v-if="platformName === 'Email'"
        class="ri-mail-line"
      ></i>
      <img
        v-else
        :src="findIcon(platform)"
        :alt="platformName"
        class="member-channels-icon"
    /></a>

    <span
      v-else
      class="btn p-2 text-base hover:cursor-auto"
      :class="getIconClass(platform)"
      @click.stop
    >
      <img
        :src="findIcon(platform)"
        :alt="platformName"
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
import { defineProps } from 'vue'
import integrationsJsonArray from '@/jsons/integrations.json'

defineProps({
  platform: {
    type: String,
    required: true
  },
  platformName: {
    type: String,
    required: true
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

const trackClick = (channel) => {
  window.analytics.track('Click Member Contact', {
    channel
  })
}

const getIconClass = (platform) => {
  if (platform === 'email') {
    return 'leading-none cursor-pointer bg-white text-brand-500 border border-gray-200'
  } else if (platform === 'twitter') {
    return 'btn--twitter'
  } else if (platform === 'github') {
    return 'bg-gray-100 border border-gray-200'
  } else if (platform === 'devto') {
    return 'bg-gray-100 border border-gray-200'
  } else if (platform === 'discord') {
    return 'btn--discord cursor-auto hover:cursor-auto'
  } else if (platform === 'slack') {
    return 'btn--slack cursor-auto hover:cursor-auto bg-white border border-gray-200'
  }
}

const findIcon = (platform) => {
  return integrationsJsonArray.find(
    (p) => p.platform === platform
  ).image
}
</script>

<style lang="scss">
.member-channels-icon {
  min-width: 1rem;
  min-height: 1rem;
  max-width: 1rem;
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
