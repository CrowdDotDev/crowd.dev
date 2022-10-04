<template>
  <div class="flex items-center gap-2">
    <el-tooltip
      v-if="member.email"
      popper-class="custom-identity-tooltip"
      placement="top"
    >
      <template #content
        ><span
          >Send email
          <i
            class="ri-external-link-line text-gray-400"
          ></i></span
      ></template>
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
        popper-class="custom-identity-tooltip"
        placement="top"
      >
        <template #content>
          <span>
            Twitter Profile
            <i
              v-if="member.attributes.url.twitter"
              class="ri-external-link-line text-gray-400"
            ></i>
          </span>
        </template>
        <a
          :href="member.attributes.url.twitter || null"
          target="_blank"
          class="btn p-2 text-base btn--twitter"
          :class="
            member.attributes.url.twitter
              ? 'hover:cursor-pointer'
              : 'hover:cursor-auto'
          "
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
        popper-class="custom-identity-tooltip"
        placement="top"
      >
        <template #content>
          <span>
            GitHub Profile
            <i
              v-if="member.attributes.url.github"
              class="ri-external-link-line text-gray-400"
            ></i>
          </span>
        </template>
        <a
          :href="member.attributes.url.github || null"
          target="_blank"
          class="btn p-2 text-base bg-gray-100 border border-gray-200"
          :class="
            member.attributes.url.github
              ? 'hover:cursor-pointer'
              : 'hover:cursor-auto'
          "
          @click.stop="trackClick('GitHub')"
        >
          <img
            :src="findIcon('github')"
            alt="Github"
            class="member-channels-icon"
          />
        </a>
      </el-tooltip>
      <el-tooltip
        v-if="member.username.linkedin"
        placement="top"
      >
        <template #content>
          <span>
            LinkedIn Profile
            <i
              v-if="member.attributes.url.linkedin"
              class="ri-external-link-line text-gray-400"
            ></i>
          </span>
        </template>
        <a
          href="https://linkedin.com"
          target="_blank"
          class="btn p-2 text-base btn--linkedin"
          :class="
            member.attributes.url.linkedin
              ? 'hover:cursor-pointer'
              : 'hover:cursor-auto'
          "
          @click.stop="trackClick('LinkedIn')"
        >
          <img
            :src="findIcon('linkedin')"
            alt="LinkedIn"
            class="member-channels-icon"
          />
        </a>
      </el-tooltip>
      <el-tooltip
        v-if="member.username.devto"
        placement="top"
      >
        <template #content>
          <span>
            DEV Profile
            <i
              v-if="member.attributes.url.devto"
              class="ri-external-link-line text-gray-400"
            ></i>
          </span>
        </template>
        <a
          :href="member.attributes.url.devto || null"
          target="_blank"
          class="btn p-2 text-base bg-gray-100 border border-gray-200"
          :class="
            member.attributes.url.devto
              ? 'hover:cursor-pointer'
              : 'hover:cursor-auto'
          "
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
      <el-tooltip
        v-if="member.username.discord"
        placement="top"
      >
        <template #content>Discord Profile</template>
        <span
          v-if="member.username.discord"
          class="btn p-2 text-base btn--discord cursor-auto hover:cursor-auto"
          @click.stop
        >
          <img
            :src="findIcon('discord')"
            alt="Discord"
            class="member-channels-icon"
          />
        </span>
      </el-tooltip>
      <el-tooltip
        v-if="member.username.slack"
        placement="top"
      >
        <template #content>Slack Profile</template>
        <span
          v-if="member.username.slack"
          class="btn p-2 text-base btn--slack cursor-auto hover:cursor-auto bg-white border border-gray-200"
          @click.stop
        >
          <img
            :src="findIcon('slack')"
            alt="Slack"
            class="member-channels-icon"
          />
        </span>
      </el-tooltip>
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
