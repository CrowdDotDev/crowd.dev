<template>
  <div v-if="member.organizations.length" class="flex flex-col gap-3">
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
          <img :src="organization.logo" alt="Logo" />
        </div>
        <i v-else class="ri-community-line text-sm text-gray-300" />
      </div>
      <div class="max-w-full">
        <p
          class="text-gray-900 text-sm line-clamp-1 font-medium underline decoration-dashed decoration-gray-400 underline-offset-4
          hover:decoration-gray-900 hover:cursor-pointer hover:!text-gray-900"
        >
          {{ organization.displayName || organization.name || '-' }}
        </p>
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
            <img v-if="organization.logo" :src="organization.logo" alt="Logo" />
            <i v-else class="ri-community-line text-sm text-gray-300" />
          </div>
          <div class="max-w-full">
            <p
              class="text-gray-900 text-sm line-clamp-1 font-medium underline decoration-2 decoration-dashed decoration-gray-400 underline-offset-4
          hover:decoration-gray-900 hover:cursor-pointer hover:!text-gray-900"
            >
              {{ organization.displayName || organization.name || '-' }}
            </p>
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

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const currentOrganizations = computed(() => props.member.organizations.filter((o) => !o.memberOrganizations?.dateEnd));
const slicedOrganizations = computed(() => currentOrganizations.value.slice(0, 3));
const remainingOrganizations = computed(() => currentOrganizations.value.slice(3));
</script>

<script>
export default {
  name: 'AppMemberOrganizations',
};
</script>
