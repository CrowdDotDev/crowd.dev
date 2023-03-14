<template>
  <div v-if="activity.title || activity.body">
    <div
      v-if="
        activity.title &&
        (!activity.parent ||
          !activity.parent.body ||
          !activity.parent.body !== activity.title) &&
        displayTitle
      "
    >
      <span class="block title" :class="titleClasses">{{
        activity.title
      }}</span>
    </div>

    <div
      v-if="activity.title && activity.body && displayTitle"
      class="mt-3"
    ></div>
    <div class="content">
      <component
        :is="platformConfig.activityContent"
        v-if="
          activity.body && platformConfig.activityContent
        "
        ref="content"
        :activity="activity"
        :display-body="displayBody"
        :display-thread="displayThread"
        :body-class="
          showMore && !more ? `line-clamp-${limit}` : ''
        "
      ></component>
      <div v-else-if="activity.body">
        <blockquote
          v-if="activity.thread && displayThread"
          class="relative px-3 border-l-4 text-gray-500 border-gray-200 text-xs leading-5 mb-4 parsed-body"
          v-html="$sanitize($marked(activity.thread.body))"
        />
        <span
          v-if="
            activity.type === 'reaction_added' &&
            displayBody
          "
          v-html="contentRenderEmojis(`:${activity.body}:`)"
        />
        <span
          v-else-if="displayBody"
          ref="body"
          class="block whitespace-pre-wrap custom-break-all activity-body parsed-body c-content"
          :class="
            showMore && !more ? `line-clamp-${limit}` : ''
          "
          v-html="
            contentRenderEmojis(
              $sanitize($marked(activity.body))
            )
          "
        />
      </div>
    </div>
    <div class="flex justify-between items-center">
      <div>
        <div
          v-if="displayShowMore"
          class="text-sm text-brand-500 mt-6 cursor-pointer"
          @click.stop="more = !more"
        >
          Show {{ more ? 'less' : 'more' }}
        </div>
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import joypixels from 'emoji-toolkit'
import { CrowdIntegrations } from '@/integrations/integrations-config'

export default {
  name: 'AppActivityContent',
  props: {
    activity: {
      type: Object,
      required: true
    },
    // classes to bind to title
    titleClasses: {
      type: String,
      required: false,
      default: ''
    },
    // if display show more and limit content
    showMore: {
      type: Boolean,
      required: false,
      default: false
    },
    // number of lines limited when showMore is enabled
    limit: {
      type: Number,
      required: false,
      default: 4
    },
    // if title is displayed
    displayTitle: {
      type: Boolean,
      required: false,
      default: true
    },
    // if thread is displayed
    displayThread: {
      type: Boolean,
      required: false,
      default: true
    },
    // if body is displayed
    displayBody: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      more: false,
      displayShowMore: false
    }
  },
  computed: {
    platformConfig() {
      return CrowdIntegrations.getConfig(
        this.activity.platform
      )
    }
  },
  mounted() {
    if (this.showMore) {
      if (this.$refs.body) {
        const body = this.$refs.body
        const height = body.clientHeight
        const scrollHeight = body.scrollHeight
        this.displayShowMore = scrollHeight > height
      } else if (this.$refs.content) {
        const content = this.$refs.content
        if (content.$refs.body) {
          const body = content.$refs.body
          const height = body.clientHeight
          const scrollHeight = body.scrollHeight
          this.displayShowMore = scrollHeight > height
        }
      }
    }
  },
  methods: {
    contentRenderEmojis(content) {
      return joypixels
        .toImage(content)
        .trim()
        .replaceAll(
          new RegExp('(?<!"):[a-z_-]+:', 'g'),
          '<abbr class="no-underline" title="Unable to detect emoji">&#65533;</abbr>'
        )
    }
  }
}
</script>

<style scoped lang="scss">
.content::v-deep {
  a {
    @apply text-brand-500;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 16px;
  }
}

.title {
  @apply text-sm font-medium;
}
</style>
