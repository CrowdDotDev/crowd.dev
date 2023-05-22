<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-black">
          Identities
        </div>
      </div>
      <div class="-mx-6 mt-6">
        <a
          v-if="getIdentityLink('github')"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            getIdentityLink('github')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('github')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="github" />
            <span class="text-gray-900 text-xs">
              GitHub</span>
          </div>
          <i
            v-if="getIdentityLink('github')"
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <a
          v-if="getIdentityLink('twitter')"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            getIdentityLink('twitter')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('twitter')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="twitter" />
            <span class="text-gray-900 text-xs">
              Twitter</span>
          </div>
          <i
            v-if="getIdentityLink('twitter')"
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <a
          v-if="getIdentityLink('linkedin')"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            getIdentityLink('linkedin')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('linkedin')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="linkedin" />
            <span class="text-gray-900 text-xs">
              LinkedIn</span>
          </div>
          <i
            v-if="getIdentityLink('linkedin')"
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <a
          v-if="getIdentityLink('crunchbase')"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            getIdentityLink('crunchbase')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('crunchbase')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="crunchbase" />
            <span class="text-gray-900 text-xs">
              Crunchbase</span>
          </div>
          <i
            v-if="getIdentityLink('crunchbase')"
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <a
          v-if="getIdentityLink('facebook')"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            getIdentityLink('facebook')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('facebook')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="facebook" />
            <span class="text-gray-900 text-xs">
              Facebook</span>
          </div>
          <i
            v-if="getIdentityLink('facebook')"
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <el-divider
          v-if="showDivider"
          class="border-t-gray-200"
        />
        <a
          v-for="email of organization.emails"
          :key="email"
          class="px-6 py-2 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`mailto:${email}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="email" />
            <span class="text-gray-900 text-xs">
              {{ email }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <a
          v-for="phone of organization.phoneNumbers"
          :key="phone"
          class="px-6 py-2 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`tel:${phone}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="phone" />
            <span class="text-gray-900 text-xs">
              {{ phone }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          />
        </a>

        <div
          v-if="noIdentities"
          class="text-sm text-gray-600 px-6"
        >
          <router-link
            :to="{
              name: 'organizationEdit',
              params: { id: organization.id },
            }"
          >
            Add identities
          </router-link>
        </div>
      </div>

      <div v-if="shouldShowAttributes">
        <div class="mt-10">
          <div class="font-medium text-black">
            Attributes
          </div>

          <app-organization-aside-enriched
            :organization="organization"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import enrichmentAttributes, { attributesTypes } from '@/modules/organization/config/organization-enrichment-attributes';
import { withHttp } from '@/utils/string';
import AppOrganizationAsideEnriched from './_aside/_aside-enriched.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const showDivider = computed(
  () => (!!props.organization.emails?.length
      || !!props.organization.phoneNumbers?.length)
    && (!!props.organization.github
      || !!props.organization.linkedin
      || !!props.organization.twitter
      || !!props.organization.crunchbase
      || !!props.organization.facebook),
);

const noIdentities = computed(() => (
  !props.organization.github?.url
    && !props.organization.linkedin?.url
    && !props.organization.twitter?.url
    && !props.organization.crunchbase?.url
    && !props.organization.facebook?.url
    && (!props.organization.emails
      || props.organization.emails.length === 0)
    && (!props.organization.phoneNumbers
      || props.organization.phoneNumbers.length === 0)
));

const shouldShowAttributes = computed(() => enrichmentAttributes.some((a) => {
  if (a.type === attributesTypes.multiSelect) {
    return !!props.organization[a.name]?.length;
  }

  return !!props.organization[a.name];
}));

const getIdentityLink = (platform) => {
  if (props.organization[platform]?.url) {
    return withHttp(props.organization[platform]?.url);
  } if (props.organization[platform]?.handle) {
    let url;

    if (platform === 'linkedin') {
      url = 'https://www.linkedin.com/company';
    } else if (platform === 'github') {
      url = 'https://github.com/';
    } else if (platform === 'twitter') {
      url = 'https://twitter.com/';
    } else if (platform === 'crunchbase') {
      url = 'https://www.crunchbase.com/organization/';
    } else if (platform === 'facebook') {
      url = 'https://www.facebook.com/';
    } else {
      return null;
    }

    return `${url}${props.organization[platform].handle}`;
  }
  return null;
};
</script>

<script>
export default {
  name: 'AppMemberViewAside',
};
</script>
