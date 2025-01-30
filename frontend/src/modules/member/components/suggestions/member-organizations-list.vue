<template>
  <div
    v-for="{
      id,
      logo,
      name,
      displayName,
      memberOrganizations,
    } of props.member.organizations"
    :key="id"
    class="flex justify-start gap-3 mb-4"
  >
    <div
      class="min-w-[24px] w-6 h-6 rounded-md border border-gray-200 p-1 flex items-center justify-center overflow-hidden"
      :class="{
        'bg-white': logo,
        'bg-gray-50': !logo,
      }"
    >
      <img
        v-if="logo"
        :src="logo"
        :alt="`${displayName || name} logo`"
      />
      <lf-icon v-else name="house-building" :size="16" class="text-gray-300" />
    </div>
    <div class="flex flex-col gap-1">
      <div
        class="text-xs text-gray-900 group-hover:text-primary-500 transition font-medium"
      >
        {{ displayName || name }}
      </div>
      <div v-if="hasValues(memberOrganizations)" class="text-gray-600 text-2xs">
        <span v-if="memberOrganizations.title">{{ memberOrganizations.title }}</span>
        <span v-if="memberOrganizations.title" class="mx-1">•</span>
        <span>
          {{ memberOrganizations.dateStart
            ? moment(memberOrganizations.dateStart).utc().format('MMMM YYYY')
            : 'Unknown' }}
        </span>
        <span class="mx-1 whitespace-nowrap">-></span>
        <span>
          {{ memberOrganizations.dateEnd
            ? moment(memberOrganizations.dateEnd).utc().format('MMMM YYYY')
            : memberOrganizations.dateStart ? 'Present' : 'Unknown' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment/moment';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const hasValues = (organizations: {
  title: string,
  dateEnd: string,
  dateStart: string
}) => Object.values(organizations || {});

</script>

<script lang="ts">
export default {
  name: 'AppMemberOrganizationList',
};
</script>
