<template>
  <section v-if="props.loading">
    <div class="rounded p-6 transition pb-40" :class="{ 'bg-gray-50': n === 1 }">
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
  <section v-else>
    <div class="rounded p-6 transition h-full" :class="{ 'bg-gray-50': props.isPrimary }">
      <!-- primary member -->
      <div class="h-13 flex justify-between items-start">
        <div v-if="props.isPrimary" class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium">
          Primary member
        </div>
        <el-button v-else :disabled="isEditLockedForSampleData" type="button" class="btn btn--bordered btn--sm" @click="emit('makePrimary')">
          <span class="ri-arrow-left-right-fill text-base text-gray-600 mr-2" />
          <span>Make primary</span>
        </el-button>
        <slot name="action" />
      </div>
      <app-avatar :entity="member" class="mb-3" />
      <div class="pb-4">
        <h6 class="text-base text-black font-semibold" v-html="$sanitize(member.displayName)" />
        <div
          v-if="member.attributes.bio"
          class="text-gray-600 leading-5 !text-xs truncate !whitespace-normal h-10 merge-member-bio"
          v-html="$sanitize(member.attributes.bio.default)"
        />
        <div v-else-if="extendBio" class="h-10" />
      </div>

      <div>
        <article class="flex items-center justify-between h-12 border-b border-gray-200">
          <p class="text-2xs font-medium text-gray-500">
            Engagement level
          </p>
          <app-community-engagement-level :member="member" />
        </article>
        <article class="flex items-center justify-between h-12 border-b border-gray-200">
          <p class="text-2xs font-medium text-gray-500">
            Location
          </p>
          <p class="text-xs text-gray-900">
            {{ member.attributes.location?.default || '-' }}
          </p>
        </article>
        <article class="flex items-center justify-between h-12 border-b border-gray-200">
          <p class="text-2xs font-medium text-gray-500">
            Organization
          </p>
          <app-member-organizations
            :member="member"
            :show-title="false"
          />
        </article>
        <article class="flex items-center justify-between h-12 border-b border-gray-200">
          <p class="text-2xs font-medium text-gray-500">
            Title
          </p>
          <p class="text-xs text-gray-900">
            {{ member.attributes.jobTitle?.default || '-' }}
          </p>
        </article>
        <article class="flex items-center justify-between h-12 border-b border-gray-200">
          <p class="text-2xs font-medium text-gray-500">
            Member since
          </p>
          <p class="text-xs text-gray-900">
            {{ moment(member.joinedAt).format('YYYY-MM-DD') }}
          </p>
        </article>
        <article class="flex items-center justify-between h-12 border-b border-gray-200">
          <p class="text-2xs font-medium text-gray-500">
            Tags
          </p>
          <app-tags v-if="member.tags.length > 0" :member="member" :editable="false" />
          <span v-else>-</span>
        </article>
      </div>
      <div class="pt-5">
        <a
          v-for="(username, platform) in member.username"
          :key="platform"
          :href="identityUrl(platform, username, member)"
          class="pb-2 pt-3 flex items-center text-gray-900 hover:text-brand-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            v-if="platformDetails(platform)"
            :src="platformDetails(platform).image"
            class="h5 w-5 mr-4"
            :alt="platform"
          >
          <span class="text-xs leading-5" v-html="$sanitize(username)" />
        </a>
        <a
          v-for="email of member.emails"
          :key="email"
          :href="`mailto:${email}`"
          class="pb-2 pt-3 flex items-center text-gray-900 hover:text-brand-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="ri-mail-line text-lg text-gray-600" />
          <span class="text-xs leading-5">{{ email }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppCommunityEngagementLevel from '@/modules/member/components/member-engagement-level.vue';
import AppTags from '@/modules/tag/components/tag-list.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { MemberPermissions } from '@/modules/member/member-permissions';
import moment from 'moment';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const props = defineProps({
  member: {
    type: Object,
    required: true,
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
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(['makePrimary']);

const { currentTenant, currentUser } = mapGetters('auth');

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);

const platformDetails = (platform) => CrowdIntegrations.getConfig(platform);
const identityUrl = (platform, username, member) => {
  if (platform === 'hackernews') {
    return `https://news.ycombinator.com/user?id=${username}`;
  } if (
    platform === 'linkedin'
    && username.includes('private-')
  ) {
    return null;
  }
  return member.attributes.url?.[platform];
};

</script>

<script>
export default {
  name: 'AppMemberMergeSuggestionsDetails',
};
</script>

<style lang="scss">
.merge-member-bio *{
  @apply text-xs;
}
</style>
