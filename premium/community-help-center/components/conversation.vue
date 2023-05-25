<template>
  <conversation-wrapper
    :full="full"
    :conversation-slug="conversation.slug"
    :tenant="tenant"
    :tenant-slug="tenantSlug"
    :mode="mode"
    :styles="styles"
  >
    <div class="flex flex-wrap items-center">
      <div
        class="min-w-0 flex-1 md:flex sm:items-center sm:justify-between w-full"
      >
        <div class="truncate w-full">
          <div class="flex text-sm">
            <div class="flex mr-1 flex-shrink-0 font-normal h-4 w-4 my-auto">
              <platform-icon
                :platform="conversation.conversationStarter?.platform"
                :styles="styles"
              />
            </div>
            <p
              v-html="conversation.title"
              class="font-medium truncate pr-3 text-base"
              :style="colors('color:text')"
            />
          </div>
          <div class="mt-2 md:flex">
            <div
              class="flex items-center text-sm"
              :style="colors('color:textSecondary')"
            >
              <FireIcon
                class="flex-shrink-0 mr-1.5 h-4 w-4"
                :style="colors('color:textSecondary')"
                aria-hidden="true"
              />
              <p>
                Last active
                {{ conversation.lastActive }}
              </p>
            </div>
            <div
              class="flex items-center text-sm md:ml-4 mt-2 md:mt-0"
              :style="colors('color:textSecondary')"
            >
              <ReplyIcon
                class="flex-shrink-0 mr-1.5 h-4 w-4"
                :style="colors('color:textSecondary')"
                aria-hidden="true"
              />
              <p>{{ conversation.activities.length }} replies</p>
            </div>
            <div
              class="flex items-center text-sm md:ml-4 mt-2 md:mt-0"
              :style="colors('color:textSecondary')"
            >
              <EyeIcon
                class="flex-shrink-0 mr-1.5 h-4 w-4"
                :style="colors('color:textSecondary')"
                aria-hidden="true"
              />
              <p>{{ conversation.views }} views</p>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0 mt-2 md:mt-0 md:ml-12" v-if="!full">
          <div class="flex -space-x-1 overflow-hidden">
            <div
              v-for="activity in sliceActivities()"
              :key="activity.timestamp"
            >
              <avatar :activity="activity" :styles="styles" />
            </div>
            <div v-if="morePeople">
              <avatar
                variant="raw"
                :activity="{
                  author: `+${morePeople}`,
                  authorLength: 0,
                }"
                :styles="styles"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="md:ml-5 flex-shrink-0">
        <ChevronRightIcon class="h-5 w-5" aria-hidden="true" v-if="!full" />
      </div>
      <div
        class="w-full"
        :class="{ feedWrapper: conversation.activitiesHighlight.length > 0 }"
      >
        <ul class="-mb-8">
          <li
            v-for="(activity, activityIdx) in conversation.activitiesHighlight"
            :key="activityIdx"
          >
            <div class="relative pb-8 pl-4 pr-4">
              <span
                v-if="
                  activityIdx !== conversation.activitiesHighlight.length - 1
                "
                class="absolute top-4 left-4 ml-4 h-full w-0.5"
                :style="colors('backgroundColor:textSecondary:80:1')"
                aria-hidden="true"
              />
              <div class="relative flex space-x-3">
                <div>
                  <avatar
                    class="p-1"
                    :activity="activity"
                    variant="full"
                    :styles="styles"
                  />
                </div>
                <div
                  class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4"
                >
                  <div>
                    <div
                      v-html="markdown(activity.body)"
                      class="myem text-sm"
                      :style="colors('color:text')"
                    />
                  </div>
                </div>
              </div>
              <div
                v-if="activity.attachments && activity.attachments.length"
                class="flex w-full flex-wrap"
              >
                <img
                  class="ml-12 max-h-96 max-w-xs max-w-3/4 my-2 md:max-w-full rounded-md shadow-md"
                  v-for="attachment in activity.attachments"
                  :src="attachment.url"
                  :key="attachment.createdAt"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="md:hidden mt-3 pt-2 border-t border-gray-50 mx-6" v-if="full">
      <div class="flex items-center justify-center text-sm">
        <FireIcon class="flex-shrink-0 mr-1.5 h-4 w-4" aria-hidden="true" />
        <p>
          Last active
          {{ conversation.lastActive }}
        </p>
      </div>
      <div
        class="flex items-center text-sm justify-center md:ml-4 mt-2 md:mt-0"
      >
        <ReplyIcon class="flex-shrink-0 mr-1.5 h-4 w-4" aria-hidden="true" />
        <p>{{ conversation.activities.length }} replies</p>
      </div>
      <div
        class="flex items-center text-sm justify-center md:ml-4 mt-2 md:mt-0"
      >
        <EyeIcon class="flex-shrink-0 mr-1.5 h-4 w-4" aria-hidden="true" />
        <p>{{ conversation.views }} views</p>
      </div>
    </div>
    <div
      v-if="full"
      class="w-full flex justify-center md:justify-end mt-2 md:mt-6"
    >
      <a
        class="flex items-center text-sm hover:underline hover:cursor-pointer"
        :style="colors('color:textSecondary')"
        :href="conversation.url"
        target="_blank"
      >
        <ExternalLinkIcon
          class="flex-shrink-0 mr-1.5 h-4 w-4"
          aria-hidden="true"
        />
        <span>
          Join conversation on
          <span class="capitalize"> {{ conversation.conversationStarter?.platform }} </span>
        </span>
      </a>
    </div>
  </conversation-wrapper>
</template>

<script>
import Showdown from 'showdown'
import {ChevronRightIcon, ExternalLinkIcon, EyeIcon, FireIcon, ReplyIcon,} from "@heroicons/vue/solid";
import Avatar from "./avatar.vue";
import PlatformIcon from "./platformIcon.vue";
import ConversationWrapper from "./conversationWrapper.vue";
import {defineComponent} from "@vue/composition-api";
import makeStyles from "~~/helpers/makeStyles";

export default defineComponent({
  components: {
    FireIcon,
    EyeIcon,
    ExternalLinkIcon,
    ChevronRightIcon,
    ReplyIcon,
    Avatar,
    PlatformIcon,
    ConversationWrapper,
  },
  props: {
    conversation: {
      type: Object,
      required: true,
    },
    full: {
      type: Boolean,
      default: false,
    },
    tenantSlug: {
      type: String,
      default: null,
    },
    tenant: {
      type: Object,
      default: () => {},
    },
    mode: {
      type: String,
      default: null,
    },
    styles: {
      type: Object,
      default: () => undefined,
    },
  },
  data() {
    return {
      maxContributors: 2,
      people: [],
    };
  },

  methods: {
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
    sliceActivities() {
      return this.morePeople
        ? this.conversation.activities.slice(0, this.maxContributors)
        : this.conversation.activities;
    },
    markdown(body) {
      const converter = new Showdown.Converter({ simpleLineBreaks: true })
      return converter.makeHtml(body)
    }
  },

  computed: {
    morePeople() {
      return this.conversation.activities.length > this.maxContributors
        ? this.conversation.activities.length - this.maxContributors
        : 0;
    },
  },
});
</script>
<style scoped>
.feedWrapper {
  @apply mt-4 border-t border-background pt-4;
}

.conversation-starter {
  @apply font-semibold;
}
</style>
