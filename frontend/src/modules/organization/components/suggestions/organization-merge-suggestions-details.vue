<template>
  <section v-if="props.loading">
    <div
      class="rounded p-6 transition pb-40"
      :class="{ 'bg-gray-50': props.isPrimary }"
    >
      <app-loading height="48px" width="48px" radius="50%" class="mb-6" />

      <app-loading height="16px" width="172px" radius="3px" class="mb-6" />

      <app-loading height="12px" width="100%" radius="3px" class="mb-3" />
      <app-loading height="12px" width="80%" radius="3px" class="mb-8" />

      <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
      <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
      <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
      <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
      <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
    </div>
  </section>
  <section v-else class="h-full">
    <div
      class="rounded p-6 transition h-full"
      :class="{ 'bg-gray-50': props.isPrimary }"
    >
      <!-- primary member -->
      <div class="h-13 flex justify-between items-start">
        <div
          v-if="props.isPrimary"
          class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
        >
          Primary organization
        </div>
        <button
          v-else
          :disabled="isEditLockedForSampleData"
          type="button"
          class="btn btn--bordered btn--sm leading-5 !px-4 !py-1"
          @click="emit('makePrimary')"
        >
          <span class="ri-arrow-left-right-fill text-base text-gray-600 mr-2" />
          <span>Make primary</span>
        </button>
        <slot name="action" />
      </div>
      <div class="pb-4">
        <app-avatar
          :entity="{
            avatar: props.organization.logo,
            displayName: (props.organization.displayName || props.organization.name)?.replace('@', ''),
          }"
          class="mr-4 mb-4"
        />
        <div>
          <h6
            class="text-base text-black font-semibold"
            v-html="$sanitize(props.organization.displayName || props.organization.name)"
          />
          <div
            v-if="props.organization.description"
            ref="bio"
            class="text-gray-600 leading-5 !text-xs merge-member-bio"
            :class="{ 'line-clamp-2': !more }"
            v-html="$sanitize(props.organization.description)"
          />
          <div
            v-else-if="compareOrganization?.description"
            ref="bio"
            class="text-transparent invisible leading-5 !text-xs merge-member-bio line-clamp-2"
            v-html="$sanitize(compareOrganization?.description)"
          />

          <div
            v-if="displayShowMore"
            class="text-sm text-brand-500 mt-2 cursor-pointer"
            :class="{ invisible: !props.organization.description }"
            @click.stop="more = !more"
          >
            Show {{ more ? 'less' : 'more' }}
          </div>
        </div>
      </div>

      <div>
        <article
          v-if="
            props.organization.website
              || props.compareOrganization?.website
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Website
          </p>
          <a
            :href="withHttp(props.organization.website)"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-gray-900 text-right"
          >{{ props.organization.website || '-' }}</a>
        </article>
        <article
          v-if="
            props.organization.location
              || props.compareOrganization?.location
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Location
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ props.organization.location || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.employees
              || props.compareOrganization?.employees
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Number of employees
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ props.organization.employees || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.revenueRange
              || props.compareOrganization?.revenueRange
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Annual Revenue
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ revenueRange.displayValue(
              props.organization.revenueRange,
            ) || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.industry
              || props.compareOrganization?.industry
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Industry
          </p>
          <p class="text-xs text-gray-900 text-right first-letter:uppercase">
            {{ props.organization.industry || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.type
              || props.compareOrganization?.type
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Industry
          </p>
          <p class="text-xs text-gray-900 text-right first-letter:uppercase">
            {{ props.organization.type || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.founded
              || props.compareOrganization?.founded
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Industry
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ props.organization.founded || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.joinedAt
              || props.compareOrganization?.joinedAt
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Joined date
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ formatDateToTimeAgo(props.organization.joinedAt) || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.memberCount
              || props.compareOrganization?.memberCount
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            # of members
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ props.organization.memberCount || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.activityCount
              || props.compareOrganization?.activityCount
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            # of Activities
          </p>
          <p class="text-xs text-gray-900 text-right">
            {{ props.organization.activityCount || '-' }}
          </p>
        </article>
      </div>
      <div class="pt-5">
        <a
          v-if="getIdentityLink('github')"
          class="py-2 flex items-center relative text-gray-900"
          :class="
            getIdentityLink('github')
              ? 'hover:text-brand-500 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('github')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="github" />
            <span class="text-xs">
              GitHub</span>
          </div>
          <i
            v-if="getIdentityLink('github')"
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-if="getIdentityLink('twitter')"
          class="py-2 flex items-center relative text-gray-900"
          :class="
            getIdentityLink('twitter')
              ? 'hover:text-brand-500 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('twitter')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="twitter" />
            <span class="text-xs">
              Twitter</span>
          </div>
          <i
            v-if="getIdentityLink('twitter')"
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-if="getIdentityLink('linkedin')"
          class="py-2 flex items-center relative text-gray-900"
          :class="
            getIdentityLink('linkedin')
              ? 'hover:text-brand-500 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('linkedin')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="linkedin" />
            <span class="text-xs">
              LinkedIn</span>
          </div>
          <i
            v-if="getIdentityLink('linkedin')"
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-if="getIdentityLink('crunchbase')"
          class="py-2 flex items-center relative text-gray-900"
          :class="
            getIdentityLink('crunchbase')
              ? 'hover:text-brand-500 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('crunchbase')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="crunchbase" />
            <span class="text-xs">
              Crunchbase</span>
          </div>
          <i
            v-if="getIdentityLink('crunchbase')"
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-if="getIdentityLink('facebook')"
          class="py-2 flex items-center relative text-gray-900"
          :class="
            getIdentityLink('facebook')
              ? 'hover:text-brand-500 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('facebook')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="facebook" />
            <span class="text-xs">
              Facebook</span>
          </div>
          <i
            v-if="getIdentityLink('facebook')"
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-if="getIdentityLink('hubspot')"
          class="py-2 flex items-center relative text-gray-900"
          :class="
            getIdentityLink('hubspot')
              ? 'hover:text-brand-500 transition-colors cursor-pointer'
              : ''
          "
          :href="getIdentityLink('hubspot')"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="hubspot" />
            <span class="text-xs">
              HubSpot</span>
          </div>
          <i
            v-if="getIdentityLink('hubspot')"
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-for="email of props.organization.emails"
          :key="email"
          class="py-2 flex items-center relative hover:text-brand-500 transition-colors cursor-pointer text-gray-900"
          :href="`mailto:${email}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="email" />
            <span class="text-xs">
              {{ email }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
        <a
          v-for="phone of props.organization.phoneNumbers"
          :key="phone"
          class="py-2 flex items-center relative hover:text-brand-500 transition-colors cursor-pointer text-gray-900"
          :href="`tel:${phone}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="phone" />
            <span class="text-xs">
              {{ phone }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300 pl-2"
          />
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  computed, defineProps, onMounted, ref, defineExpose,
} from 'vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { withHttp } from '@/utils/string';
import { formatDateToTimeAgo } from '@/utils/date';
import revenueRange from '@/modules/organization/config/enrichment/revenueRange';
import AppPlatform from '@/shared/platform/platform.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => null,
  },
  compareOrganization: {
    type: Object,
    required: false,
    default: () => null,
  },
  isPrimary: {
    type: Boolean,
    required: false,
    default: false,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  extendBio: {
    type: Number,
    required: false,
    default: 0,
  },
});

const emit = defineEmits(['makePrimary', 'bioHeight']);

const { currentTenant, currentUser } = mapGetters('auth');

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

const bio = ref(null);
const displayShowMore = ref(null);
const more = ref(null);

const getIdentityLink = (platform) => {
  if (props.organization[platform]?.url) {
    return withHttp(props.organization[platform]?.url);
  }
  if (props.organization[platform]?.handle) {
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
  if (props.organization.attributes?.url?.[platform]) {
    return props.organization.attributes?.url?.[platform];
  }
  return null;
};

onMounted(() => {
  setTimeout(() => {
    if (!bio.value) {
      return;
    }
    const height = bio.value.clientHeight;
    const { scrollHeight } = bio.value;
    displayShowMore.value = scrollHeight > height || false;
    emit('bioHeight', scrollHeight);
  }, 0);
});

defineExpose({
  more,
});
</script>

<script>
export default {
  name: 'AppOrganizationMergeSuggestionsDetails',
};
</script>

<style lang="scss">
.merge-member-bio * {
  @apply text-xs;
}
</style>
