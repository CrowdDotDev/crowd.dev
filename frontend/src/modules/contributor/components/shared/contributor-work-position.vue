<template>
  <div v-if="jobTitle && organization" class="flex items-center gap-1.5 text-small text-gray-500">
    <p class="max-w-42 truncate">
      {{ jobTitle }} <span v-if="organization">at</span>
    </p>
    <img v-if="organization" :src="organization.logo" :alt="organization.displayName" class="w-4 h-4 rounded border border-gray-200" />
    <router-link
      v-if="organization"
      :to="{
        name: 'organizationView',
        params: { id: organization.id },
        query: {
          projectGroup: selectedProjectGroup?.id,
          segmentId: props.contributor.segmentId,
        },
      }"
      class="cursor-pointer underline decoration-dashed text-gray-500
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 hover:!text-black max-w-30 truncate"
    >
      {{ organization.displayName }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import { computed } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  contributor: Contributor,
}>();

const { activeOrganization } = useContributorHelpers();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const organization = computed(() => activeOrganization(props.contributor));
const jobTitle = computed(() => props.contributor.attributes.jobTitle?.default
    || organization.value?.memberOrganizations?.title);
</script>

<script lang="ts">
export default {
  name: 'LfContributorWorkPosition',
};
</script>
