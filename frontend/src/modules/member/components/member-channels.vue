<template>
  <div class="flex items-center gap-2">
    <el-tooltip
      v-if="member.email"
      content="Send email <i class='ri-external-link-line text-gray-400'></i>"
      popper-class="custom-identity-tooltip"
      raw-content
      placement="top"
    >
      <a
        :href="`mailto:${member.email}`"
        class="btn p-2 text-base leading-none cursor-pointer bg-white text-brand-500 border border-gray-200"
        @click.stop="trackClick('Email')"
        ><i class="ri-mail-line"></i
      ></a>
    </el-tooltip>
    <div class="flex gap-2 items-center">
      <el-tooltip
        v-if="member.username.twitter"
        content="Twitter Profile <i class='ri-external-link-line'></i>"
        popper-class="custom-identity-tooltip"
        raw-content
        placement="top"
      >
        <a
          :href="member.url?.twitter || null"
          target="_blank"
          class="btn p-2 text-base btn--twitter"
          @click.stop="trackClick('Twitter')"
        >
          <img
            :src="findIcon('twitter')"
            alt="Twitter"
            class="member-channels-icon"
          />
        </a>
      </el-tooltip>
      <el-tooltip
        v-if="member.username.github"
        content="GitHub Profile <i class='ri-external-link-line'></i>"
        popper-class="custom-identity-tooltip"
        raw-content
        placement="top"
      >
        <a
          :href="member.url?.github || null"
          target="_blank"
          class="btn p-2 text-base cursor-pointer bg-gray-100 border border-gray-200"
          @click.stop="trackClick('GitHub')"
        >
          <img
            :src="findIcon('github')"
            alt="Github"
            class="member-channels-icon"
          />
        </a>
      </el-tooltip>
      <!-- TODO: Missing design for linkedin -->
      <el-tooltip
        v-if="member.username.linkedin"
        content="LinkedIn Profile <i class='ri-external-link-line'></i>"
        placement="top"
      >
        <a
          href="https://linkedin.com"
          target="_blank"
          class="btn p-2 text-base btn--linkedin"
          @click.stop="trackClick('LinkedIn')"
        >
          <img
            :src="findIcon('linkedin')"
            alt="LinkedIn"
            class="member-channels-icon"
          />
        </a>
      </el-tooltip>
      <!-- TODO: (TBC) Shouldn't the tooltip have the url validation as well? If there is no URL doesn't make sense to ask to open -->
      <el-tooltip
        v-if="member.username.devto"
        content="DEV Profile <i class='ri-external-link-line'></i>"
        placement="top"
      >
        <a
          :href="member.url?.devto || null"
          target="_blank"
          class="btn p-2 text-base cursor-pointer bg-gray-100 border border-gray-200"
          @click.stop="trackClick('Dev.to')"
        >
          <img
            :src="findIcon('devto')"
            alt="DEV"
            class="member-channels-icon"
          />
        </a>
      </el-tooltip>
      <!-- TODO: (TBC) Discord does not have link, is there still any tooltip? -->
      <span
        v-if="member.username.discord"
        class="btn p-2 text-base btn--discord"
        @click.stop
      >
        <img
          :src="findIcon('discord')"
          alt="Discord"
          class="member-channels-icon"
        />
      </span>
      <span
        v-if="member.username.slack"
        class="btn p-2 text-base btn--slack bg-white border border-gray-200"
        @click.stop
      >
        <img
          :src="findIcon('slack')"
          alt="Slack"
          class="member-channels-icon"
        />
      </span>
    </div>
  </div>
</template>

<script>
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'AppMemberChannels',
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    trackClick(channel) {
      window.analytics.track('Click Member Contact', {
        channel
      })
    },

    findIcon(platform) {
      return integrationsJsonArray.find(
        (p) => p.platform === platform
      ).image
    }
  }
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

.btn {
  &--twitter,
  &--twitter:hover {
    @apply cursor-pointer;
    background-color: rgba(29, 155, 240, 0.15);
    color: #1d9bf0;
  }

  &--linkedin,
  &--linkedin:hover {
    @apply cursor-pointer;
    background-color: rgba(2, 116, 179, 0.1);
    color: #0274b3;
  }

  &--discord,
  &--discord:hover {
    background-color: rgba(88, 101, 242, 0.15);
  }
}

a[href]:hover {
  opacity: 1;
}
</style>
