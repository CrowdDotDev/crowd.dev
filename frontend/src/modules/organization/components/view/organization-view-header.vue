<template>
  <div class="organization-view-header panel relative">
    <div class="flex items-start justify-between">
      <div class="flex items-start">
        <app-avatar
          :entity="{
            avatar: organization.logo,
            displayName: organization.name?.replace('@', ''),
          }"
          size="xl"
          class="mr-4"
        />
        <div>
          <div class="flex">
            <h5>{{ organization.name }}</h5>
            <app-organization-badge
              class="ml-2"
              :organization="organization"
            />
          </div>
          <div
            class="text-sm text-gray-600 flex items-center"
          >
            <div
              v-if="organization.website"
              class="flex items-center"
            >
              <i class="ri-link mr-1" />
              <a
                :href="withHttp(organization.website)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-600"
              >{{ organization.website }}</a>
            </div>
            <span
              v-if="
                organization.website
                  && organization.location
              "
              class="mx-2"
            >·</span>
            <div
              v-if="organization.location"
              class="flex items-center"
            >
              <i class="ri-map-pin-2-line mr-1" />
              <span>{{ organization.location }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center">
        <app-organization-dropdown
          :organization="organization"
        />
      </div>
    </div>
    <div
      class="py-6 border-b border-gray-200 mb-4"
    >
      <app-organization-headline :organization="organization" />

      <div
        v-if="organization.description"
        ref="descriptionRef"
        class="mt-2 text-sm text-gray-600 line-clamp-4"
        v-html="$sanitize(organization.description)"
      />
      <!-- show more/less button -->
      <div
        v-if="displayShowMore"
        class="text-2xs text-brand-500 mt-3 cursor-pointer"
        @click.stop="toggleContent"
      >
        Show {{ showMore ? 'less' : 'more' }}
      </div>
    </div>

    <div class="grid grid-rows-2 grid-flow-col gap-4">
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          # of members
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.memberCount,
              'number',
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          # of Activities
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.activityCount,
              'number',
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Headcount
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.size,
              'string',
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Joined date
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.joinedAt,
              'relative',
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Annual Revenue
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.revenueRange,
              'revenueRange',
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Last active
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.lastActive,
              'relative',
            )
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  defineProps, ref, computed,
} from 'vue';
import moment from 'moment';
import {
  formatDate,
  formatDateToTimeAgo,
} from '@/utils/date';
import {
  formatNumber,
  formatNumberToCompact,
  formatRevenueRange,
} from '@/utils/number';
import { withHttp } from '@/utils/string';
import AppOrganizationBadge from '@/modules/organization/components/organization-badge.vue';
import AppOrganizationDropdown from '@/modules/organization/components/organization-dropdown.vue';
import AppOrganizationHeadline from '@/modules/organization/components/organization-headline..vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const showMore = ref(false);
const descriptionRef = ref(null);
const displayShowMore = computed(() => {
  if (!props.organization.description) {
    return false;
  }

  return descriptionRef.value?.scrollHeight > descriptionRef.value?.clientHeight;
});

const toggleContent = () => {
  showMore.value = !showMore.value;
  if (showMore.value) {
    descriptionRef.value?.classList.remove('line-clamp-4');
  } else {
    descriptionRef.value?.classList.add('line-clamp-4');
  }
};

const formattedInformation = (value, type) => {
  // Show dash for empty information
  if (
    value === undefined
    || value === null
    || value === -1
    // If the timestamp is 1970, we show "-"
    || (type === 'date'
      && moment(value).isBefore(
        moment().subtract(40, 'years'),
      ))
    // If range is not set for revenue
    || (type === 'revenueRange'
      && (value.min === undefined
        || value.max === undefined
        || value.min === null
        || value.max === null))
  ) {
    return '-';
  }

  // Render inforamation depending on type
  if (type === 'date') {
    return formatDate({ timestamp: value });
  } if (type === 'number') {
    return formatNumber(value);
  } if (type === 'relative') {
    return formatDateToTimeAgo(value);
  } if (type === 'compact') {
    return formatNumberToCompact(value);
  } if (type === 'revenueRange') {
    return formatRevenueRange(value);
  }

  return value;
};
</script>

<script>
export default {
  name: 'AppMemberViewHeader',
};
</script>
