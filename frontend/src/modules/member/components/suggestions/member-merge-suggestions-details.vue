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
          v-if="props.isPreview"
          class="bg-brand-800 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
        >
          Preview
        </div>
        <div
          v-else-if="props.isPrimary"
          class="bg-brand-100 rounded-full py-0.5 px-2 text-brand-800 inline-block text-xs leading-5 font-medium"
        >
          Primary contributor
        </div>
        <button
          v-else
          :disabled="isEditLockedForSampleData"
          type="button"
          class="btn btn--secondary btn--sm leading-5 !px-4 !py-1"
          @click="emit('makePrimary')"
        >
          <span class="ri-arrow-left-right-fill text-base text-gray-600 mr-2" />
          <span>Make primary</span>
        </button>
        <slot name="action" />
      </div>
      <div class="flex justify-between">
        <router-link
          v-if="!isPreview"
          :to="{
            name: 'memberView',
            params: { id: member.id },
            query: { projectGroup: selectedProjectGroup?.id },
          }"
          target="_blank"
        >
          <div class="relative">
            <app-avatar
              :entity="member"
              class="mb-3"
            />
            <el-tooltip
              v-if="member.attributes?.avatarUrl?.default && getAttributeSourceName(member.attributes.avatarUrl)"
              :content="`Source: ${getAttributeSourceName(member.attributes.avatarUrl)}`"
              placement="top"
              trigger="hover"
            >
              <div
                class="absolute top-0 right-[-6px] z-10 h-4 w-4 rounded-full flex items-center justify-center"
                :class="{
                  'bg-white': !props.isPrimary,
                  'bg-gray-50': props.isPrimary,
                }"
              >
                <app-svg name="source" class="h-3 w-3" />
              </div>
            </el-tooltip>
          </div>
        </router-link>
        <app-avatar
          v-else
          :entity="member"
          class="mb-3"
        />
      </div>
      <div class="pb-4">
        <router-link
          v-if="!isPreview"
          :to="{
            name: 'memberView',
            params: { id: member.id },
            query: { projectGroup: selectedProjectGroup?.id },
          }"
          target="_blank"
        >
          <h6
            class="text-base text-black font-semibold hover:text-brand-500"
            v-html="$sanitize(member.displayName)"
          />
        </router-link>
        <h6
          v-else
          class="text-base text-black font-semibold"
          v-html="$sanitize(member.displayName)"
        />
        <div class="flex items-center">
          <div
            v-if="member.attributes.bio?.default"
            ref="bio"
            class="text-gray-600 leading-5 !text-xs merge-member-bio"
            :class="{ 'line-clamp-2': !more }"
            v-html="$sanitize(member.attributes.bio.default)"
          />
          <div
            v-else-if="compareMember?.attributes.bio?.default"
            ref="bio"
            class="text-transparent invisible leading-5 !text-xs merge-member-bio line-clamp-2"
            v-html="$sanitize(compareMember?.attributes.bio.default)"
          />
          <el-tooltip
            v-if="!isPreview && member.attributes?.bio?.default && getAttributeSourceName(member.attributes.bio)"
            :content="`Source: ${getAttributeSourceName(member.attributes.bio)}`"
            placement="top"
            trigger="hover"
          >
            <div class="ml-1">
              <app-svg name="source" class="h-3 w-3" />
            </div>
          </el-tooltip>
        </div>

        <div
          v-if="displayShowMore"
          class="text-sm text-brand-500 mt-2 cursor-pointer"
          :class="{ invisible: !member.attributes.bio?.default }"
          @click.stop="more = !more"
        >
          Show {{ more ? 'less' : 'more' }}
        </div>
      </div>

      <div>
        <article
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Engagement level
          </p>
          <app-community-engagement-level :member="member" />
        </article>
        <article
          v-if="
            member.attributes.location?.default
              || compareMember?.attributes.location?.default
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <div class="flex items-center pr-4">
            <p class="text-2xs font-medium text-gray-500 pr-1">
              Location
            </p>
            <el-tooltip
              v-if="!isPreview && member.attributes?.location?.default && getAttributeSourceName(member.attributes.location)"
              :content="`Source: ${getAttributeSourceName(member.attributes.location)}`"
              placement="top"
              trigger="hover"
            >
              <app-svg name="source" class="h-3 w-3" />
            </el-tooltip>
          </div>
          <p class="text-xs text-gray-900 text-right whitespace-normal">
            {{ member.attributes.location?.default || '-' }}
          </p>
        </article>
        <article
          v-if="
            member.organizations.length || compareMember?.organizations.length
          "
          class="flex items-center justify-between min-h-12 border-b border-gray-200 py-2"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Organization
          </p>
          <app-member-organizations :member="member" :show-title="false" />
        </article>
        <article
          v-if="
            member.attributes.jobTitle?.default
              || compareMember?.attributes.jobTitle?.default
          "
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <div class="flex items-center pr-4">
            <p class="text-2xs font-medium text-gray-500 pr-1">
              Title
            </p>
            <el-tooltip
              v-if="!isPreview && member.attributes?.jobTitle?.default && getAttributeSourceName(member.attributes.jobTitle)"
              :content="`Source: ${getAttributeSourceName(member.attributes.jobTitle)}`"
              placement="top"
              trigger="hover"
            >
              <app-svg name="source" class="h-3 w-3" />
            </el-tooltip>
          </div>
          <p class="text-xs text-gray-900 text-right  whitespace-normal">
            {{ member.attributes.jobTitle?.default || '-' }}
          </p>
        </article>
        <article
          v-if="member.joinedAt || compareMember?.joinedAt"
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Contributor since
          </p>
          <p class="text-xs text-gray-900 text-right whitespace-normal">
            {{ moment(member.joinedAt).format('YYYY-MM-DD') }}
          </p>
        </article>
        <article
          v-if="member.tags.length > 0 || compareMember?.tags.length > 0"
          class="flex items-center justify-between h-12 border-b border-gray-200"
        >
          <p class="text-2xs font-medium text-gray-500 pr-4">
            Tags
          </p>
          <app-tags
            v-if="member.tags.length > 0"
            :member="member"
            :editable="false"
            tag-classes="!bg-white !text-xs !leading-5 !py-0.5 !px-1.5"
          />
          <span v-else>-</span>
        </article>
      </div>
      <div class="pt-5">
        <app-identities-vertical-list-members
          :member="member"
          :order="memberOrder.suggestions"
          :include-emails="true"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  computed, defineProps, onMounted, ref, defineExpose,
} from 'vue';
import moment from 'moment';
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppCommunityEngagementLevel from '@/modules/member/components/member-engagement-level.vue';
import AppTags from '@/modules/tag/components/tag-list.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import memberOrder from '@/shared/modules/identities/config/identitiesOrder/member';
import AppIdentitiesVerticalListMembers from '@/shared/modules/identities/components/identities-vertical-list-members.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppSvg from '@/shared/svg/svg.vue';
import { getAttributeSourceName } from '@/shared/helpers/attribute.helpers';

const props = defineProps({
  member: {
    type: Object,
    default: () => null,
  },
  compareMember: {
    type: Object,
    required: false,
    default: () => null,
  },
  isPrimary: {
    type: Boolean,
    required: false,
    default: false,
  },
  isPreview: {
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

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

const bio = ref(null);
const displayShowMore = ref(null);
const more = ref(null);

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
  name: 'AppMemberMergeSuggestionsDetails',
};
</script>

<style lang="scss">
.merge-member-bio * {
  @apply text-xs;
}
</style>
