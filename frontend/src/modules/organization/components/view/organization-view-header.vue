<template>
  <div class="member-view-header panel relative">
    <div class="flex items-start justify-between">
      <div class="flex items-start">
        <app-avatar
          :entity="{
            avatar: organization.logo,
            displayName: organization.name.replace('@', '')
          }"
          size="xl"
          class="mr-4"
        />
        <div class="flex items-center">
          <h5>{{ organization.name }}</h5>
        </div>
      </div>
      <div class="flex items-center">
        <app-organization-dropdown
          :organization="organization"
        />
      </div>
    </div>
    <div
      class="text-sm text-gray-600 py-6 border-b border-gray-200 mb-4"
    >
      {{ organization.description }}
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
              'number'
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
              'number'
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          # of employees
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.employees,
              'number'
            )
          }}
        </p>
      </div>
      <div>
        <p class="text-gray-400 font-medium text-2xs">
          Active since
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedInformation(
              organization.joinedAt,
              'date'
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
              'number'
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
              'date'
            )
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewHeader'
}
</script>

<script setup>
import { defineProps } from 'vue'
import AppOrganizationDropdown from '@/modules/organization/components/organization-dropdown'
import moment from 'moment'
import {
  formatDate,
  formatDateToTimeAgo
} from '@/utils/date'
import {
  formatNumber,
  formatNumberToCompact
} from '@/utils/number'

defineProps({
  organization: {
    type: Object,
    default: () => {}
  }
})

const formattedInformation = (value, type) => {
  // Show dash for empty information
  if (
    value === undefined ||
    value === null ||
    value === -1 ||
    // If the timestamp is 1970, we show "-"
    (type === 'date' &&
      moment(value).isBefore(
        moment().subtract(40, 'years')
      ))
  ) {
    return '-'
  }

  // Render inforamation depending on type
  if (type === 'date') {
    return formatDate({ timestamp: value })
  } else if (type === 'number') {
    return formatNumber(value)
  } else if (type === 'relative') {
    return formatDateToTimeAgo(value)
  } else if (type === 'compact') {
    return formatNumberToCompact(value)
  }

  return value
}
</script>

<style lang="scss">
.member-view-header.panel {
  @apply pb-24;
}
</style>
