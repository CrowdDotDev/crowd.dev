<template>
  <div class="eagle-eye-list-item">
    <div class="eagle-eye-list-item-header">
      <div class="flex items-center">
        <img
          :src="platformLogo"
          :alt="`${record.platform} logo`"
          class="h-6"
        />
        <span class="font-medium text-sm ml-2"
          >by {{ record.username }}</span
        >
      </div>
      <div class="flex items-center">
        <span class="text-sm text-gray-400">{{
          secondaryInfo
        }}</span>
        <span class="text-sm ml-4">{{ timeAgo }}</span>
      </div>
    </div>
    <div class="eagle-eye-list-item-body">
      <a
        :href="record.url"
        target="_blank"
        class="eagle-eye-list-item-body-title"
      >
        {{ record.title }}
      </a>
      <div
        class="eagle-eye-list-item-body-text"
        v-html="record.text"
      />
      <div class="eagle-eye-list-item-body-actions">
        <el-tooltip
          content="This post will be excluded from Inbox searches"
          placement="top"
          v-if="!record.status"
        >
          <el-button
            icon="ri-eye-off-line"
            class="btn btn--secondary"
            @click="handleExcludeClick"
          >
            Exclude
          </el-button>
        </el-tooltip>
        <el-button
          icon="ri-arrow-go-back-line"
          class="btn btn--secondary"
          @click="handleRevertExcludeClick"
          v-else-if="record.status === 'rejected'"
        >
          Remove from excluded
        </el-button>
        <span v-else></span>
        <el-button
          class="btn btn--secondary"
          :class="engageButtonClass"
          @click="handleEngageClick"
        >
          <i
            class="ri-lg mr-1"
            :class="engageButtonIcon"
          ></i>
          {{ engageButtonCopy }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import eagleEyeSourcesJson from '@/jsons/eagle-eye-sources.json'
import computedTimeAgo from '@/utils/time-ago'
import { mapActions } from 'vuex'
import Message from '@/shared/message/message'

export default {
  name: 'app-eagle-eye-list-item',
  props: {
    record: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    platformLogo() {
      return eagleEyeSourcesJson.find(
        (p) => p.platform === this.record.platform
      ).image
    },
    timeAgo() {
      return computedTimeAgo(this.record.timestamp)
    },
    secondaryInfo() {
      let copy = ''
      if (this.record.platform === 'hacker_news') {
        copy = `${this.record.postAttributes.score} points ・ ${this.record.postAttributes.commentsCount} comments`
      } else if (
        this.record.platform === 'devto' &&
        this.record.postAttributes.tags.length > 0
      ) {
        copy = this.record.postAttributes.tags
          .map((t) => `#${t}`)
          .join(' ')
      }

      return copy
    },
    engageButtonClass() {
      return this.record.status === 'engaged'
        ? 'btn--secondary--green'
        : 'btn--secondary--orange'
    },
    engageButtonCopy() {
      return this.record.status === 'engaged'
        ? 'Engaged'
        : 'Mark as engaged'
    },

    engageButtonIcon() {
      return this.record.status === 'engaged'
        ? 'ri-check-double-line'
        : 'ri-check-line'
    }
  },
  methods: {
    ...mapActions({
      doEngage: 'eagleEye/doEngage',
      doExclude: 'eagleEye/doExclude',
      doRevertExclude: 'eagleEye/doRevertExclude'
    }),
    async handleExcludeClick() {
      await this.doExclude(this.record.id)
      Message.success('Post excluded')
    },
    async handleRevertExcludeClick() {
      await this.doRevertExclude(this.record.id)
      Message.success('Post removed from excluded')
    },
    async handleEngageClick() {
      await this.doEngage(this.record.id)
      Message.success('Post engaged')
    }
  }
}
</script>

<style lang="scss">
.eagle-eye-list-item {
  @apply bg-white rounded-md w-full mb-6;
  border: 1px solid #e9e9e9;

  &-header {
    @apply px-5 py-4 rounded-t-md flex justify-between items-center;
    background-color: #fbfbfb;
    border-bottom: 1px solid #e9e9e9;
  }

  &-body {
    @apply bg-white rounded-b-md pt-4 pb-3 px-5;

    &-actions {
      @apply mt-4 pt-3 flex justify-between items-center;
      border-top: 1px solid #e9e9e9;
    }

    &-title {
      @apply text-black font-medium;

      &:hover {
        @apply text-gray-800;
      }
    }

    &-text {
      @apply text-sm text-gray-600;
    }
  }
}
</style>
