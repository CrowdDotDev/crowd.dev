<template>
  <div class="flex gap-10">
    <div class="flex-grow">
      <div v-if="(activity.title || displayTitleBody) || activity.body">
        <div
          v-if="
            activity.title
              && (!activity.parent
                || !activity.parent.body
                || !activity.parent.body !== activity.title)
              && displayTitle
          "
        >
          <span
            class="block"
            :class="{
              title: !titleClasses,
              [titleClasses]: titleClasses,
            }"
            v-html="
              contentRenderEmojis(
                $sanitize($marked(activity.title),
                ))
            "
          />
        </div>

        <div v-if="activity.display?.default && displayTitleBody">
          <div
            class="first-letter:uppercase font-semibold text-gray-900 text-sm mb-1"
            v-html="
              contentRenderEmojis(
                $sanitize($marked(activity.display.default)),
              )
            "
          />
        </div>

        <div
          v-if="activity.title && activity.body && displayTitle"
          class="mt-3"
        />
        <div class="content">
          <component
            :is="platformConfig.activityContent"
            v-if="
              activity.body
                && platformConfig
                && platformConfig.activityContent
            "
            ref="content"
            :activity="activity"
            :display-body="displayBody"
            :display-thread="displayThread"
            :body-class="
              showMore && !more ? `line-clamp-${limit}` : ''
            "
          />
          <div v-else-if="activity.body">
            <blockquote
              v-if="activity.thread && displayThread"
              class="relative px-3 border-l-4 text-gray-500 border-gray-200 text-xs leading-5 mb-4 parsed-body"
              v-html="$sanitize($marked(activity.thread.body))"
            />
            <span
              v-if="
                activity.type === 'reaction_added'
                  && displayBody
              "
              v-html="contentRenderEmojis(`:${activity.body}:`)"
            />
            <span
              v-else-if="displayBody"
              ref="body"
              class="block custom-break-all activity-body parsed-body c-content"
              :class="
                showMore && !more ? `line-clamp-${limit}` : ''
              "
              v-html="
                contentRenderEmojis(
                  $sanitize($marked(`<div class='whitespace-pre-wrap'>${activity.body}</div>`)),
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
            <slot name="bottomLink" />
          </div>
        </div>
        <div class="mt-2">
          <slot name="details" />
        </div>
      </div>
      <div v-else-if="activity.display?.default">
        <div
          class="first-letter:uppercase font-semibold text-gray-900 text-sm"
          v-html="
            contentRenderEmojis(
              $sanitize($marked(activity.display.default)),
            )
          "
        />
      </div>
    </div>
  </div>
</template>

<script>
import emoji from 'node-emoji';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export default {
  name: 'AppActivityContent',
  props: {
    activity: {
      type: Object,
      required: true,
    },
    // classes to bind to title
    titleClasses: {
      type: String,
      required: false,
      default: '',
    },
    // if display show more and limit content
    showMore: {
      type: Boolean,
      required: false,
      default: false,
    },
    // number of lines limited when showMore is enabled
    limit: {
      type: Number,
      required: false,
      default: 4,
    },
    // if title is displayed
    displayTitle: {
      type: Boolean,
      required: false,
      default: true,
    },
    // if thread is displayed
    displayThread: {
      type: Boolean,
      required: false,
      default: true,
    },
    // if body is displayed
    displayBody: {
      type: Boolean,
      required: false,
      default: true,
    },
    displayTitleBody: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      more: false,
      displayShowMore: false,
    };
  },
  computed: {
    platformConfig() {
      return CrowdIntegrations.getConfig(
        this.activity.platform,
      );
    },
  },
  mounted() {
    if (this.showMore) {
      if (this.$refs.body) {
        const { body } = this.$refs;
        const height = body.clientHeight;
        const { scrollHeight } = body;
        this.displayShowMore = scrollHeight > height;
      } else if (this.$refs.content) {
        const { content } = this.$refs;
        if (content.$refs.body) {
          const { body } = content.$refs;
          const height = body.clientHeight;
          const { scrollHeight } = body;
          this.displayShowMore = scrollHeight > height;
        }
      }
    }
  },
  methods: {
    contentRenderEmojis(content) {
      return emoji.emojify(
        content,
        () => '<abbr class=“no-underline” title=“Unable to detect emoji”>&#65533;</abbr>',
      );
    },
  },
};
</script>

<style scoped lang="scss">
:deep(.content) {
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

  .emoji {
    @apply w-4 h-4 inline;
  }
}

.title {
  @apply text-sm font-medium;
}
</style>
