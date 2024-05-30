<template>
  <div class="organization-view-header panel !px-0 relative">
    <div class="flex justify-between px-6">
      <div class="flex items-center">
        <app-avatar
          :entity="{
            ...organization,
            avatar: organization.logo,
            displayName: (organization.displayName || organization.name)?.replace('@', ''),
          }"
          entity-name="organization"
          size="xl"
          class="mr-4"
        />
        <div>
          <div class="flex">
            <h5>{{ organization.displayName || organization.name }}</h5>
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
    </div>
    <div v-if="organization.description || organization.headline" class="px-6 mt-6">
      <div
        class="flex items-center"
      >
        <p class="text-gray-400 font-medium text-2xs mr-2">
          Headline
        </p>
        <el-tooltip
          content="Source: Enrichment"
          placement="top"
          trigger="hover"
        >
          <app-svg name="source" class="h-3 w-3" />
        </el-tooltip>
      </div>

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
        class="text-2xs text-primary-500 mt-3 cursor-pointer"
        @click.stop="toggleContent"
      >
        Show {{ showMore ? 'less' : 'more' }}
      </div>
    </div>

    <el-divider class="!mb-4 !mt-6 border-gray-200" />

    <div class="grid grid-rows-2 grid-flow-col gap-4 px-6">
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          # of contributors
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
      <lf-enrichment-sneak-peak type="contact">
        <template #default="{ enabled }">
          <div>
            <div class="flex items-center">
              <p class="text-gray-400 font-medium text-2xs mr-2" :class="{ 'text-purple-400': !enabled }">
                Headcount
              </p>
              <el-tooltip
                v-if="organization.size || organization.employees"
                content="Source: Enrichment"
                placement="top"
                trigger="hover"
                :disabled="!enabled"
              >
                <app-svg name="source" class="h-3 w-3" />
              </el-tooltip>
            </div>

            <p v-if="enabled" class="mt-1 text-gray-900 text-xs">
              {{
                formattedInformation(
                  organization.size || organization.employees,
                  'string',
                )
              }}
            </p>
            <div v-else class="w-full mt-2">
              <div class="blur-[6px] text-gray-900 text-xs select-none">
                11-50
              </div>
            </div>
          </div>
        </template>
      </lf-enrichment-sneak-peak>
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
      <lf-enrichment-sneak-peak type="contact">
        <template #default="{ enabled }">
          <div>
            <div class="flex items-center">
              <p class="text-gray-400 font-medium text-2xs mr-2" :class="{ 'text-purple-400': !enabled }">
                Annual Revenue
              </p>
              <el-tooltip
                v-if="organization.revenueRange"
                content="Source: Enrichment"
                placement="top"
                trigger="hover"
                :disabled="!enabled"
              >
                <app-svg name="source" class="h-3 w-3" />
              </el-tooltip>
            </div>
            <p v-if="enabled" class="mt-1 text-gray-900 text-xs">
              {{
                revenueRange.displayValue(
                  organization.revenueRange,
                )
              }}
            </p>
            <div v-else class="w-full mt-2">
              <div class="blur-[6px] text-gray-900 text-xs select-none">
                $1M-$10M
              </div>
            </div>
          </div>
        </template>
      </lf-enrichment-sneak-peak>
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
import { ref, computed } from 'vue';
import moment from 'moment';
import {
  formatDate,
  formatDateToTimeAgo,
} from '@/utils/date';
import {
  formatNumber,
  formatNumberToCompact,
} from '@/utils/number';
import { withHttp } from '@/utils/string';
import AppOrganizationBadge from '@/modules/organization/components/organization-badge.vue';
import AppOrganizationHeadline from '@/modules/organization/components/organization-headline..vue';
import AppSvg from '@/shared/svg/svg.vue';
import LfEnrichmentSneakPeak from '@/shared/modules/enrichment/components/enrichment-sneak-peak.vue';
import revenueRange from '../../config/enrichment/revenueRange';

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
  }

  return value;
};
</script>

<script>
export default {
  name: 'AppMemberViewHeader',
};
</script>
