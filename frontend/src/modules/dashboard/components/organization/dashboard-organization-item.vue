<template>
  <article
    v-if="loading || !organization"
    class="flex items-center"
  >
    <app-loading height="20px" width="20px" radius="50%" />
    <div class="flex-grow pl-4">
      <app-loading
        height="12px"
        width="120px"
      />
    </div>
  </article>
  <article v-else class="flex">
    <router-link
      :to="{
        name: 'organizationView',
        params: { id: props.organization.id },
        query: { projectGroup: selectedProjectGroup?.id },
      }"
      class="flex items-center justify-between group hover:cursor-pointer w-full"
    >
      <div class="flex items-center">
        <app-avatar
          :entity="entity"
          size="xxs"
          class="mr-4"
        />
        <h6
          class="text-xs leading-5 font-medium text-gray-900 hover:text-brand-500 transition"
        >
          {{ organization.displayName || organization.name }}
        </h6>
      </div>
      <div>
        <p class="text-2xs leading-4.5 !text-gray-400">
          {{ organization.memberCount }} contributor{{
            organization.memberCount > 1 ? 's' : ''
          }}
        </p>
      </div>
    </router-link>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const props = defineProps({
  organization: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const entity = computed(() => ({
  avatar: props.organization.logo,
  displayName: props.organization.name.replace('@', ''),
}));
</script>

<script>
export default {
  name: 'AppDashboardOrganizationItem',
};
</script>
