<template>
  <div
    v-if="member.attributes?.jobTitle?.default || activeOrganization?.memberOrganizations?.title"
    class="flex items-start grow mt-2"
  >
    <span class="text-sm text-gray-900 line-clamp-2">
      {{ member.attributes?.jobTitle?.default || activeOrganization?.memberOrganizations?.title }}
    </span>
  </div>
  <div v-else class="text-gray-500 text-xs">
    -
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const activeOrganization = computed(() => {
  const { organizations } = props.member;

  // No active organization
  if (!organizations?.length) {
    return null;
  }

  // Only one organization that doesn't have either start or end date
  // We assume it's the active organization
  if (organizations.length === 1
    && !organizations[0].memberOrganizations?.dateStart
    && !organizations[0].memberOrganizations?.dateEnd) {
    return organizations[0];
  }

  // Get all organizations that have a start date but not an end date (present)
  const completeOrganizations = organizations
    .filter((organization) => !!organization.memberOrganizations?.dateStart && !organization.memberOrganizations?.dateEnd);

  // Return the most recent organization, comparing the startDate
  const mostRecent = completeOrganizations.reduce((mostRecent, organization) => {
    const mostRecentStartDate = new Date(mostRecent.memberOrganizations?.dateStart);
    const organizationStartDate = new Date(organization.memberOrganizations?.dateStart);

    if (organizationStartDate > mostRecentStartDate) {
      return organization;
    }

    return mostRecent;
  }, completeOrganizations.length ? completeOrganizations[0] : null);

  if (mostRecent) {
    return mostRecent;
  }

  return organizations[0];
});
</script>

<script>
export default {
  name: 'AppMemberOrganizations',
};
</script>
