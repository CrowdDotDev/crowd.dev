<template>
  <header
    class="flex-shrink-0 fixed top-0 w-screen h-16 flex items-center z-50"
    :style="colors('backgroundColor:bgNav')"
  >
    <div class="absolute inset-y-0 left-0 md:static md:flex-shrink-0">
      <a
        :href="to"
        class="flex items-center justify-center mx-4 w-8 h-full focus:outline-none focus:ring-2 focus:ring-inset md:w-32"
      >
        <img class="h-8 w-auto" :src="logoUrl" alt="Logo-amall" />
      </a>
    </div>
    <!-- Desktop nav area -->
    <div class="flex-1 flex justify-between">
      <div class="lg:min-w-0 flex-1">
        <div class="hidden lg:block">
          <slot v-if="tenant" />
        </div>
      </div>
      <div
        v-if="tenant"
        class="ml-10 pr-4 flex-shrink-0 flex items-center space-x-5"
      >
        <a
          v-if="singleInvite"
          :href="singleInvite.inviteLink"
          target="”_blank”"
        >
          <button
            class="rounded-lg text-white opacity-90 hover:opacity-100 h-10 px-4 text-sm"
            :style="colors(['backgroundColor:primary', 'color:textCta'])"
          >
            <span class="inline-flex w-full justify-center items-center mt-1">
              <platform-icon
                :platform="singleInvite.platform"
                class="w-7 mr-2"
                fill="bgNav"
                :styles="styles"
              />
              Join the {{ name }} community
            </span>
          </button>
        </a>
        <Menu v-else as="div" class="relative inline-block text-left">
          <div>
            <MenuButton
              class="inline-flex justify-center w-full rounded-md border shadow-sm px-4 py-2 text-sm font-medium"
              :style="colors(['backgroundColor:primary', 'color:textCta'])"
            >
              Join the {{ name }} community
              <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </MenuButton>
          </div>

          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <MenuItems
              class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg ring-opacity-5 focus:outline-none"
              :style="colors('backgroundColor:primary')"
            >
              <div class="py-1">
                <MenuItem
                  v-for="(inviteLink, platform) in computedInviteLinks"
                  class="opacity-80 hover:opacity-100 py-2"
                  :key="platform"
                >
                  <a
                    :href="inviteLink"
                    target="”_blank”"
                    class="block text-sm w-full"
                  >
                    <span
                      class="inline-flex w-full items-center ml-4"
                      :style="colors('color:textCta')"
                    >
                      <platform-icon
                        :platform="platform"
                        class="w-7 mr-2"
                        fill="textCta"
                        :styles="styles"
                      />
                      {{ transformPlatform(platform) }}
                    </span>
                  </a>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
      <div v-else class="mr-10 pr-4 flex-shrink-0 flex items-center space-x-5">
        <main-cta />
      </div>
    </div>
  </header>
</template>
<script>
import { defineComponent } from "@vue/composition-api";
import makeStyles from "~~/helpers/makeStyles";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/solid";

import mainCta from "./mainCta.vue";
export default defineComponent({
  components: {
    mainCta,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    ChevronDownIcon,
  },
  props: {
    tenant: {
      required: true,
    },
    to: {
      required: true,
    },
    styles: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    computedInviteLinks() {
      return {
        ...Object.keys(this.tenant.inviteLinks)
          .filter((i) => {
            return this.tenant.inviteLinks[i] !== "";
          })
          .reduce((acc, i) => {
            acc[i] = this.tenant.inviteLinks[i];
            return acc;
          }, {}),
        website: this.homepageLink,
      };
    },
    singleInvite() {
      if (this.tenant && Object.keys(this.computedInviteLinks).length === 1) {
        const platform = Object.keys(this.computedInviteLinks)[0];
        return {
          platform,
          inviteLink: this.computedInviteLinks[platform],
        };
      }
      return false;
    },
    homepageLink() {
      return this.tenant ? this.tenant.website : "#";
    },
    logoUrl() {
      return this.tenant && this.tenant.logoUrl
        ? this.tenant.logoUrl
        : "/crowd-white.svg";
    },
    name() {
      return this.tenant ? this.tenant.tenantName : "";
    },
  },

  methods: {
    titleCase(str) {
      var splitStr = str.toLowerCase().split("-");
      for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] =
          splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
      }
      // Directly return the joined string
      return splitStr.join(" ");
    },
    colors(picks) {
      return makeStyles(this.styles, picks);
    },
    transformPlatform(platform) {
      switch (platform) {
        case "github":
          return "GitHub";
        case "discord":
          return "Discord";
        case "slack":
          return "Slack";
        case "website":
          return "Website";
        default:
          return platform;
      }
    },
  },
});
</script>
