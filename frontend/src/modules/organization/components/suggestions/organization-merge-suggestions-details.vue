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
          class="flex items-center justify-between h-12 border-b border-gray-200 truncate"
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
            # of contacts
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
        <template v-if="props.organization.identities && props.organization.identities.length > 0">
          <a
            v-for="(identity, ii) of props.organization.identities"
            :key="ii"
            class="py-2 flex items-center relative text-gray-900 transition-colors"
            :class="getIdentityLink(identity) ? 'hover:text-brand-500 cursor-pointer' : ''"
            :href="getIdentityLink(identity)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="flex gap-3 items-center">
              <app-platform :platform="identity.platform" />
              <span class="text-xs">
                {{ getPlatformDetails(identity.platform)?.organization.handle(identity)
                  ?? getPlatformDetails(identity.platform)?.name
                  ?? identity.platform }}</span>
            </div>
            <i
              v-if="identity.url"
              class="ri-external-link-line text-gray-300 pl-2"
            />
          </a>
        </template>
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
import { CrowdIntegrations } from '@/integrations/integrations-config';

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

const getPlatformDetails = (platform) => CrowdIntegrations.getConfig(platform);

const getIdentityLink = (identity) => {
  if (identity.url) {
    return withHttp(identity.url);
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
