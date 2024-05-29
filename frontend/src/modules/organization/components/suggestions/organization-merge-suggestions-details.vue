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
      <slot name="header">
        <div class="h-13 flex justify-between items-start">
          <div
            v-if="props.isPreview"
            class="bg-primary-800 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
          >
            Preview
          </div>
          <div
            v-else-if="props.isPrimary"
            class="bg-primary-100 rounded-full py-0.5 px-2 text-primary-800 inline-block text-xs leading-5 font-medium"
          >
            Primary organization
          </div>
          <button
            v-else
            type="button"
            class="btn btn--bordered btn--sm leading-5 !px-4 !py-1"
            @click="emit('makePrimary')"
          >
            <span class="ri-arrow-left-right-fill text-base text-gray-600 mr-2" />
            <span>Make primary</span>
          </button>
          <slot name="action" />
        </div>
      </slot>
      <div class="pb-6">
        <app-organization-merge-dialog v-model="isMergeDialogOpen" />
        <div class="flex justify-between">
          <router-link
            v-if="!isPreview && props.organization?.id"
            :to="{
              name: 'organizationView',
              params: { id: organization.id },
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            target="_blank"
          >
            <app-avatar
              :entity="{
                ...props.organization,
                avatar: props.organization.logo,
                displayName: (props.organization.displayName || props.organization.name)?.replace('@', ''),
              }"
              entity-name="organization"
              class="mr-4 mb-4"
            />
          </router-link>
          <app-avatar
            v-else
            :entity="{
              ...props.organization,
              avatar: props.organization.logo,
              displayName: (props.organization.displayName || props.organization.name)?.replace('@', ''),
            }"
            entity-name="organization"
            class="mr-4 mb-4"
          />
        </div>
        <div>
          <router-link
            v-if="!isPreview && props.organization.id"
            :to="{
              name: 'organizationView',
              params: { id: organization.id },
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            target="_blank"
          >
            <h6
              class="text-base text-black font-semibold hover:text-primary-500 leading-6"
              v-html="$sanitize(props.organization.displayName || props.organization.name)"
            />
          </router-link>
          <h6
            v-else
            class="text-base text-black font-semibold leading-6"
            v-html="$sanitize(props.organization.displayName || props.organization.name)"
          />
          <div
            v-if="props.organization.description"
            ref="bio"
            class="text-gray-600 leading-5 !text-xs merge-member-bio mt-2"
            :class="{ 'line-clamp-2': !more }"
            v-html="$sanitize(props.organization.description)"
          />
          <div
            v-else-if="compareOrganization?.description"
            ref="bio"
            class="text-transparent invisible leading-5 !text-xs merge-member-bio line-clamp-2 mt-2"
            v-html="$sanitize(compareOrganization?.description)"
          />

          <div
            v-if="displayShowMore"
            class="text-sm text-primary-500 mt-2 cursor-pointer"
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
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Website
          </p>
          <a
            :href="withHttp(props.organization.website)"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-gray-900 whitespace-normal inline-block leading"
          >{{ props.organization.website || '-' }}</a>
        </article>
        <article
          v-if="
            props.organization.location
              || props.compareOrganization?.location
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Location
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
            {{ props.organization.location || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.employees
              || props.compareOrganization?.employees
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            # of employees
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
            {{ props.organization.employees || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.revenueRange
              || props.compareOrganization?.revenueRange
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Annual Revenue
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
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
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Industry
          </p>
          <p class="text-xs text-gray-900 first-letter:uppercase whitespace-normal">
            {{ props.organization.industry || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.type
              || props.compareOrganization?.type
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Type
          </p>
          <p class="text-xs text-gray-900 first-letter:uppercase whitespace-normal">
            {{ props.organization.type || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.founded
              || props.compareOrganization?.founded
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Founded
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
            {{ props.organization.founded || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.joinedAt
              || props.compareOrganization?.joinedAt
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            Joined date
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
            {{ formatDateToTimeAgo(props.organization.joinedAt) || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.memberCount
              || props.compareOrganization?.memberCount
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            # of contributors
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
            {{ props.organization.memberCount || '-' }}
          </p>
        </article>
        <article
          v-if="
            props.organization.activityCount
              || props.compareOrganization?.activityCount
          "
          class="pb-4"
        >
          <p class="text-2xs font-medium text-gray-500 pb-1">
            # of Activities
          </p>
          <p class="text-xs text-gray-900 whitespace-normal">
            {{ props.organization.activityCount || '-' }}
          </p>
        </article>
      </div>
      <div class="pt-4">
        <h6 class="text-sm font-semibold pb-3">
          Identities
        </h6>
        <app-identities-vertical-list-organizations
          :organization="organization"
          :include-emails="true"
          :include-phone-numbers="true"
          :order="organizationOrder.suggestions"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  onMounted, ref,
} from 'vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { withHttp } from '@/utils/string';
import { formatDateToTimeAgo } from '@/utils/date';
import revenueRange from '@/modules/organization/config/enrichment/revenueRange';
import AppIdentitiesVerticalListOrganizations from '@/shared/modules/identities/components/identities-vertical-list-organizations.vue';
import organizationOrder from '@/shared/modules/identities/config/identitiesOrder/organization';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

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

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

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
  name: 'AppOrganizationMergeSuggestionsDetails',
};
</script>

<style lang="scss">
.merge-member-bio * {
  @apply text-xs;
}
</style>
