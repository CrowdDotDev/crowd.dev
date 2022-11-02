<template>
  <div class="min-h-screen bg-background flex flex-col" v-if="styles">
    <top-header
      :tenant="tenant"
      :styles="styles"
      :to="`/${mode === 'urlPath' ? tenantSlug : ''}`"
    />
    <main-section :styles="styles">
      <div v-if="conversation" class="block my-2">
        <div class="border-b border-gray-200 -mb-px flex space-x-8">
          <NuxtLink
            :to="`/${mode === 'urlPath' ? tenantSlug : ''}`"
            class="border-transparent whitespace-nowrap pt-4 pb-3 px-1 border-b-2 font-medium text-sm opacity-80 hover:opacity-100"
            :style="colors(['color:textSecondary'])"
            click="clickHandler"
          >
            <button class="inline-flex">
              <ChevronLeftIcon
                class="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              Back to search
            </button>
          </NuxtLink>
        </div>
        <conversation
          :conversation="conversation"
          :full="true"
          :tenant-slug="tenantSlug"
          :tenant="tenant"
          :mode="mode"
          :styles="styles"
        />
      </div>
    </main-section>
  </div>
</template>

<script>
import MainSection from "~~/components/mainSection.vue";
import TopHeader from "~~/components/topHeader.vue";
import { ChevronLeftIcon } from "@heroicons/vue/solid";
import Conversation from "~~/components/conversation.vue";
import makeStyles from "~~/helpers/makeStyles";
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  async setup(props) {
    let isLoaded = useState("isLoaded", () => {
      return {
        conversations: false,
        mode: false,
      };
    });

    const { data, refresh } = await useAsyncData(
      `getConversation-${props.tenantSlug}-${props.conversationSlug}`,
      () =>
        $fetch("/api/getConversations", {
          params: {
            tenantSlug: props.tenantSlug,
            q: "",
            filter: `slug=${props.conversationSlug}`,
            highlightMatches: false,
            page: 1,
            getTenant: true,
            addView: true,
          },
        })
    );

    const conversation =
      data.value.conversations.length > 0
        ? data.value.conversations[0]
        : undefined;

    function search() {
      refresh();
    }

    return {
      conversation,
      isLoaded,
      search,
    };
  },
  components: { TopHeader, MainSection, ChevronLeftIcon, Conversation },
  props: {
    conversationSlug: {
      type: String,
      default: null,
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

  methods: {
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
    clickHandler() {
      this.isLoaded.mode = false;
    },
    truncatedTitle() {
      const first50Chars = this.conversation.title.substr(0, 50)
      if (first50Chars.substr(47, 50).includes('...')) {
        return first50Chars
      } else {
        return first50Chars + '...'
      }
    }
  },

  created() {
    this.isLoaded = {
      conversations: true,
      mode: true,
    };

    const faviconUrl =
      this.tenant && this.tenant.faviconUrl
        ? this.tenant.faviconUrl
        : "https://app.crowd.dev/images/icon.png";
    const title = this.conversation
      ? `${this.truncatedTitle()} | ${this.tenant.tenantName}`
      : "Open crowd.dev";
    useHead({
      title,
      meta: [
        {
          name: 'description',
          content: this.conversation.activities[0].body
        }
      ],
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: faviconUrl,
        },
      ],
    });
  },
});
</script>

<style></style>
