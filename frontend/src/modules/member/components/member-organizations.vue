<template>
  <div v-if="orientation === 'vertical'">
    <div v-if="activeOrganization">
      <router-link
        :to="{
          name: 'organizationView',
          params: { id: activeOrganization.id },
        }"
        class="flex items-start hover:cursor-pointer"
        @click.stop
      >
        <div v-if="activeOrganization.logo">
          <div class="w-5 h-5 mr-1">
            <img :src="activeOrganization.logo" alt="Logo" />
          </div>
        </div>
        <div class="max-w-full">
          <p
            class="text-gray-900 text-sm text-ellipsis truncate hover:text-brand-500 transition leading-relaxed"
          >
            {{ activeOrganization.displayName || activeOrganization.name || '-' }}
          </p>
        </div>
      </router-link>
      <div
        v-if="
          props.showTitle
            && props.member.attributes.jobTitle?.default
        "
        class="text-gray-500 text-2xs truncate pr-4"
      >
        {{
          props.member.attributes.jobTitle?.default
            || '-'
        }}
      </div>
    </div>
    <div
      v-else-if="props.member.attributes.jobTitle?.default"
    >
      <p class="text-gray-900 text-ellipsis truncate">
        -
      </p>
      <div
        v-if="props.showTitle"
        class="text-gray-500 text-2xs"
      >
        {{
          props.member.attributes.jobTitle?.default || '-'
        }}
      </div>
    </div>
    <div v-else class="text-gray-900">
      -
    </div>
  </div>
  <div
    v-else-if="
      member.attributes.jobTitle?.default
        || activeOrganization
    "
    class="flex items-start grow mt-2"
  >
    <span
      v-if="member.attributes?.jobTitle?.default"
      class="text-gray-600 text-2xs mr-2 truncate block mt-0.5"
    >{{ member.attributes.jobTitle.default }}
      {{ activeOrganization ? 'at' : '' }}</span>
    <div
      v-if="activeOrganization"
      class="flex gap-2 flex-wrap max-w-[70%]"
    >
      <router-link
        :to="{
          name: 'organizationView',
          params: { id: activeOrganization.id },
        }"
        class="badge--interactive"
        @click.stop
      >
        <img
          v-if="activeOrganization.logo"
          :src="activeOrganization.logo"
          alt="Logo"
          class="w-3.5"
        />
        <span class="text-xs">{{
          activeOrganization.displayName || activeOrganization.name || '-'
        }}</span>
      </router-link>
    </div>
  </div>
  <div v-else class="text-gray-900">
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
  showTitle: {
    type: Boolean,
    default: true,
  },
  orientation: {
    type: String,
    default: () => 'vertical',
  },
});

const activeOrganization = computed(() => {
  const { organizations } = props.member;

  // No active config
  if (!organizations?.length) {
    return null;
  }

  // Only one config that doesn't have either start or end date
  // We assume it's the active config
  if (organizations.length === 1
    && !organizations[0].memberOrganizations?.dateStart
    && !organizations[0].memberOrganizations?.dateEnd) {
    return organizations[0];
  }

  // Get all organizations that have a start date but not an end date (present)
  const completeOrganizations = organizations
    .filter((organization) => !!organization.memberOrganizations?.dateStart && !organization.memberOrganizations?.dateEnd);

  // Return the most recent config, comparing the startDate
  return completeOrganizations.reduce((mostRecent, organization) => {
    const mostRecentStartDate = new Date(mostRecent.memberOrganizations?.dateStart);
    const organizationStartDate = new Date(organization.memberOrganizations?.dateStart);

    if (organizationStartDate > mostRecentStartDate) {
      return organization;
    }

    return mostRecent;
  }, completeOrganizations.length ? completeOrganizations[0] : null);
});
</script>

<script>
export default {
  name: 'AppMemberOrganizations',
};
</script>
