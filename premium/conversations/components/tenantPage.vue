<template>
  <div>
    <div
      v-if="styles"
      class="min-h-screen flex flex-col"
      :style="colors('backgroundColor:bg')"
    >
      <top-header
        :tenant="tenant"
        :styles="styles"
        :to="`/${mode === 'urlPath' ? tenantSlug : ''}`"
      >
        <div class="seachBar-wrapper">
          <label for="search" class="sr-only">Search</label>
          <input
            type="search"
            v-model="q"
            class="searchBar"
            :style="colors(['backgroundColor:bg', 'color:textSecondary'])"
            ref="searchBarMain"
            @focus="setFocus(true)"
            @blur="setFocus(false)"
          />
          <div class="searchBar-icon">
            <SearchIcon
              class="h-5 w-5 opacity-60"
              aria-hidden="true"
              :style="colors('color:textSecondary')"
            />
            <span
              v-if="!isFocused && q == ''"
              class="text-sm opacity-60 ml-2"
              :style="colors('color:textSecondary')"
            >
              {{ searchPlaceholder }}
            </span>
          </div>
        </div>
      </top-header>

      <main-section :styles="styles">
        <div class="lg:hidden w-full px-4 pt-4 mt-2">
          <div class="seachBar-wrapper">
            <label for="search" class="sr-only">Search</label>
            <input id="search" type="search" v-model="q" class="searchBar" />
            <div class="searchBar-icon">
              <SearchIcon class="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div
          v-if="hasResults"
          class="max-w-full mx-auto overflow-x-scroll my-2 w-full border-b"
          :style="colors('borderColor:bg:-40')"
          aria-label="Filters"
        >
          <nav class="flex space-x-8" aria-label="Tabs">
            <nuxt-link
              v-for="platform in data.filters.platforms"
              :key="platform.name"
              :href="platformFiltersUrl[platform.name]"
              @click="clickHandler"
              class="flex items-center border-transparent whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:cursor-pointer opacity-80 hover:opacity-100"
              :class="{
                'font-semibold': platform.isActive,
              }"
              :style="
                colors([
                  [platform.isActive, 'borderColor:primary'],
                  'color:textSecondary',
                  [platform.isActive, 'color:textSecondary'],
                ])
              "
            >
              <span v-if="platform.isActive">
                <XIcon class="w-4 h-4" />
              </span>
              <platform-icon
                class="h-4 w-4 mr-1"
                :platform="platform.name"
                :styles="styles"
              />
              {{ platform.name }} ({{ platform.count.toLocaleString() }})
            </nuxt-link>
          </nav>
          <nav class="flex space-x-8" aria-label="Tabs">
            <nuxt-link
              v-for="channel in data.filters.categories"
              :key="channel.name"
              :href="channelFiltersUrl[channel.name]"
              @click="clickHandler"
              class="flex items-center border-transparent whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:cursor-pointer opacity-80 hover:opacity-100"
              :class="{
                'font-semibold': channel.isActive,
              }"
              :style="
                colors([
                  [channel.isActive, 'borderColor:primary'],
                  'color:textSecondary',
                  [channel.isActive, 'color:textSecondary'],
                ])
              "
            >
              <span v-if="channel.isActive">
                <XIcon class="w-4 h-4" />
              </span>
              <span class="ml-1">#</span>{{ channel.name }} ({{
                channel.count.toLocaleString()
              }})
            </nuxt-link>
          </nav>
        </div>

        <div>
          <ul>
            <li
              v-for="conversation in data.conversations"
              :key="conversation.id"
            >
              <conversation
                :conversation="conversation"
                :tenant="tenant"
                :tenant-slug="tenantSlug"
                :mode="mode"
                :styles="styles"
              />
            </li>
          </ul>
        </div>
        <div
          v-if="hasResults && !(page == '1' && !data.pagination.hasNextPage)"
        >
          <nav
            class="flex items-center justify-center border-t"
            :style="colors(['backgroundColor:bg', 'borderColor:bg:-40'])"
            aria-label="Pagination"
          >
            <div class="flex-1 flex justify-between max-w-7xl my-4">
              <nuxt-link
                :to="pageUrl.previous"
                class="pagination-button"
                :class="{
                  inactive: !data.pagination.hasPreviousPage,
                }"
                :style="
                  !data.pagination.hasPreviousPage
                    ? colors([
                        'color:primary',
                        'borderColor:primary',
                        'backgroundColor:bg:30:n',
                      ])
                    : colors([
                        'color:primary',
                        'borderColor:primary',
                        'backgroundColor:bg:10:1',
                      ])
                "
              >
                Previous
              </nuxt-link>
              <p
                class="hidden md:block text-sm mt-auto mb-auto"
                :style="colors('color:textSecondary:-10')"
              >
                Showing
                {{ " " }}
                <span class="font-medium">{{ uiPagination.from }}</span>
                <span v-if="uiPagination.to">
                  {{ " " }}
                  to
                  {{ " " }}
                  <span class="font-medium">{{ uiPagination.to }}</span>
                </span>
                {{ " " }}
                of
                {{ " " }}
                <span class="font-medium">{{ data.pagination.total }}</span>
                {{ " " }}
                results
              </p>
              <nuxt-link
                :to="pageUrl.next"
                class="pagination-button"
                :class="{
                  inactive: !data.pagination.hasNextPage,
                }"
                :style="
                  !data.pagination.hasNextPage
                    ? colors([
                        'color:primary',
                        'borderColor:primary',
                        'backgroundColor:bg:30:n',
                      ])
                    : colors([
                        'color:primary',
                        'borderColor:primary',
                        'backgroundColor:bg:10:1',
                      ])
                "
              >
                Next
              </nuxt-link>
            </div>
          </nav>
        </div>
      </main-section>
    </div>
  </div>
</template>

<script>
import topHeader from "~~/components/topHeader.vue";
import mainSection from "~~/components/mainSection.vue";
import conversation from "~~/components/conversation.vue";
import makeStyles from "~~/helpers/makeStyles";
import { SearchIcon, XIcon } from "@heroicons/vue/outline";
import _ from "lodash";
import { defineComponent, ref, computed } from "@vue/composition-api";

export default defineComponent({
  async setup(props) {
    const route = useRoute();

    const tenantSlug = props.tenantSlug;
    const tenant = props.tenant;

    const transformFilters = function (query) {
      return Object.entries(query)
        .filter(([key, value]) => {
          return key.includes("filter") && value.length > 0;
        })
        .map(([key, value]) => {
          return `${key.slice(key.indexOf(".") + 1)}=${value}`;
        })
        .join(" AND ");
    };

    const filtersUrl = function (filters, which) {
      const currentQuery = route.query;
      delete currentQuery.page;
      const out = {};
      for (const filter of filters) {
        let query;
        if (filter.isActive) {
          query = { ...currentQuery, [`filter.${which}`]: undefined };
        } else {
          query = {
            ...currentQuery,
            [`filter.${which}`]: filter.name,
          };
        }
        out[filter.name] = {
          path: route.path,
          query,
        };
      }
      return out;
    };

    const q = ref(route.query.q || "");
    const filter = ref(transformFilters(route.query));
    const highlightMatches = ref(true);
    const page = ref(route.query.p || 1);

    const isFocused = ref(false);
    const isLoaded = useState("isLoaded", () => {
      return {
        conversations: false,
        mode: false,
      };
    });
    const faviconUrl =
      tenant && tenant.faviconUrl
        ? tenant.faviconUrl
        : "https://app.crowd.dev/images/icon.png";
    const title =
      tenant && tenant.tenantName ? `${tenant.tenantName} | Community Help Center` : "Open crowd.dev";

    useHead({
      title,
      meta: [
        {
          name: 'description',
          content: `Find questions and discussion that happened in the ${tenant.tenantName} community.`,
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

    const { data, refresh } = await useAsyncData(
      `getConversations-${tenantSlug}`,
      () =>
        $fetch("/api/getConversations", {
          params: {
            tenantSlug: tenantSlug,
            q: q.value,
            filter: filter.value,
            highlightMatches: highlightMatches.value,
            getTenant: !tenant,
            page: page.value,
          },
        })
    );

    const hasResults = computed(() => {
      return data ? data.value && data.value.conversations.length > 0 : false;
    });

    const channelFiltersUrl = computed(() => {
      const categories = data.value.filters.categories;
      return filtersUrl(categories, "channel");
    });

    const platformFiltersUrl = computed(() => {
      const platforms = data.value.filters.platforms;
      return filtersUrl(platforms, "platform");
    });

    const search = async function () {
      await refresh();
    };

    return {
      data,
      q,
      page,
      filter,
      tenant,
      tenantSlug,
      isLoaded,
      isFocused,
      hasResults,
      channelFiltersUrl,
      platformFiltersUrl,
      search,
      transformFilters,
      filtersUrl,
    };
  },
  props: {
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
  components: {
    topHeader,
    SearchIcon,
    XIcon,
    mainSection,
    conversation,
  },
  created() {
    this.isLoaded = {
      conversations: true,
      mode: true,
    };
  },
  mounted() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && this.isFocused) {
        e.preventDefault();
        this.$refs.searchBarMain.blur();
      } else if (
        !this.isFocused &&
        e.code === "KeyK" &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();

        this.$refs.searchBarMain.focus();
      }
    });
  },

  methods: {
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
    routerPush(params) {
      this.$router.push({
        path: this.$route.path,
        query: { ...this.$route.query, ...params },
      });
    },
    setFocus(value) {
      this.isFocused = value;
    },
    clickHandler(e) {
      this.isLoaded.mode = false;
    },
  },

  watch: {
    q: {
      handler(newQ) {
        this.routerPush({ q: newQ });
      },
    },

    $route: _.debounce(async function (newRoute, oldRoute) {
      const query = newRoute.query;
      if (oldRoute.query.q !== newRoute.query.q) {
        this.page = 1;
        this.routerPush({ p: 1 });
      } else {
        this.page = query.p || 1;
      }
      this.q = query.q || "";
      this.filter = this.transformFilters(query);
      this.data = false;
      await this.search();
      this.isLoaded.mode = true;
    }, 300),
  },

  computed: {
    pageUrl() {
      function getQuery(vm, inc) {
        const next = parseInt(vm.page) + inc;
        return {
          ...vm.$route.query,
          p: Math.min(Math.max(next, 1), vm.data.pagination.total / 10 + 1),
        };
      }
      return {
        next: {
          path: this.$route.path,
          query: getQuery(this, 1),
        },
        previous: {
          path: this.$route.path,
          query: getQuery(this, -1),
        },
      };
    },
    uiPagination() {
      const from = this.data.pagination.showing[0] + 1;
      const to = Math.min(
        this.data.pagination.showing[1],
        this.data.pagination.total
      );
      return {
        from,
        to: to === from ? false : to,
      };
    },
    searchPlaceholder() {
      if (process.client) {
        const key =
          navigator.userAgent.indexOf("Mac OS X") != -1 ? "⌘" : "Ctrl+";
        return this.isFocused ? "" : `Use ${key}K to search`;
      }
    },
  },
});
</script>

<style scoped>
.pagination-container {
  @apply w-full;
}

.pagination-button {
  @apply relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md hover:cursor-pointer opacity-80 hover:opacity-100;
}

.inactive {
  @apply opacity-60 cursor-not-allowed hover:cursor-not-allowed hover:opacity-60;
}

.seachBar-wrapper {
  @apply w-full mx-auto relative;
}

.searchBar {
  @apply block w-full border-transparent pl-12 mt-1 ring-transparent focus:border-transparent sm:text-sm rounded-lg  border-0;
}

.searchBar-icon {
  @apply pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-4;
}

.channelFilter {
  @apply text-white hover:text-primary-500;
}

.channelFilterActive {
  @apply text-primary-900 hover:text-primary-500;
}
</style>
