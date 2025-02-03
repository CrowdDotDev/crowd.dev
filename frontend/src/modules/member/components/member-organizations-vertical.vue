<template>
  <div v-if="member.organizations.length && currentOrganizations.length" class="flex flex-col gap-3">
    <router-link
      v-for="organization in slicedOrganizations"
      :key="organization.id"
      :to="{
        name: 'organizationView',
        params: { id: organization.id },
        query: {
          projectGroup: selectedProjectGroup?.id,
          segmentId: member.segmentId,
        },
      }"
      class="flex items-start hover:cursor-pointer"
      @click.stop
    >
      <div class="w-6 h-6 min-w-[24px] mr-2 rounded-md overflow-hidden outline outline-1 outline-gray-200 flex items-center justify-center">
        <div v-if="organization.logo">
          <img :src="organization.logo" alt="Logo" class="w-full h-full" />
        </div>
        <lf-icon v-else name="house-building" :size="14" class="text-gray-300" />
      </div>
      <div class="max-w-full flex items-center gap-1">
        <p
          class="text-gray-900 text-sm line-clamp-1 font-medium underline decoration-dashed decoration-gray-400 underline-offset-4
          hover:decoration-gray-900 hover:cursor-pointer hover:!text-gray-900"
        >
          {{ organization.displayName || organization.name || '-' }}
        </p>
        <lf-organization-lf-member-tag
          :organization="organization"
          :only-show-icon="true"
        />
      </div>
    </router-link>
    <el-popover
      v-if="remainingOrganizations.length"
      placement="top"
      popper-class="max-h-100 overflow-auto"
      width="240px"
    >
      <template #reference>
        <div

          class="text-gray-500 text-xs px-2 h-6 flex items-center justify-center border rounded-lg w-fit border-gray-200"
        >
          +{{ pluralize('organization', remainingOrganizations.length, true) }}
        </div>
      </template>
      <div class="flex flex-col gap-3">
        <router-link
          v-for="organization in remainingOrganizations"
          :key="organization.id"
          :to="{
            name: 'organizationView',
            params: { id: organization.id },
            query: {
              projectGroup: selectedProjectGroup?.id,
              segmentId: member.segmentId,
            },
          }"
          class="flex items-start hover:cursor-pointer"
          @click.stop
        >
          <div class="w-6 h-6 mr-2 rounded-md overflow-hidden outline outline-1 outline-gray-200 flex items-center justify-center">
            <img v-if="organization.logo" :src="organization.logo" alt="Logo" class="w-full h-full" />
            <lf-icon v-else name="house-building" :size="14" class="text-gray-300" />
          </div>
          <div class="max-w-full flex items-center gap-1">
            <p
              class="text-gray-900 text-sm line-clamp-1 font-medium underline decoration-2 decoration-dashed decoration-gray-400 underline-offset-4
          hover:decoration-gray-900 hover:cursor-pointer hover:!text-gray-900"
            >
              {{ organization.displayName || organization.name || '-' }}
            </p>
            <lf-organization-lf-member-tag
              :organization="organization"
              :only-show-icon="true"
            />
          </div>
        </router-link>
      </div>
    </el-popover>
  </div>
  <div v-else class="text-gray-900">
    -
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { computed } from 'vue';
import pluralize from 'pluralize';
import LfOrganizationLfMemberTag from '@/modules/organization/components/lf-member/organization-lf-member-tag.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const currentOrganizations = computed(() => {
  const orgsWithNoEndDate = props.member.organizations
    .filter((o) => o.memberOrganizations?.dateStart && !o.memberOrganizations?.dateEnd);

  // If there are organizations with no endDate
  if (orgsWithNoEndDate.length) {
    // Sort by startDate descending and pick the most recent one
    return [orgsWithNoEndDate.sort(
      (firstOrg, secondaryOrg) => new Date(secondaryOrg.memberOrganizations?.dateStart) - new Date(firstOrg.memberOrganizations?.dateStart),
    )[0]];
  }

  // If there are no organizations with only startDate, return all with startDate and endDate
  return props.member.organizations.filter((o) => !o.memberOrganizations?.dateEnd);
});

const slicedOrganizations = computed(() => currentOrganizations.value.slice(0, 3));
const remainingOrganizations = computed(() => currentOrganizations.value.slice(3));
</script>

<script>
export default {
  name: 'AppMemberOrganizations',
};
</script>
