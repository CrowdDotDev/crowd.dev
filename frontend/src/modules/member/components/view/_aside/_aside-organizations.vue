<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Organizations
      </div>
      <router-link
        :to="{
          name: 'memberEdit',
          params: {
            id: member.id,
          },
        }"
        :class="{
          'pointer-events-none cursor-not-allowed':
            isEditLockedForSampleData,
        }"
      >
        <el-button
          class="btn btn-link btn-link--primary"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-pencil-line" /><span>Edit</span>
        </el-button>
      </router-link>
    </div>

    <div class="flex flex-col gap-4 mt-6">
      <router-link
        v-for="organization of member.organizations"
        :key="organization.id"
        :to="{
          name: 'organizationView',
          params: {
            id: organization.id,
          },
        }"
        class="group hover:cursor-pointer"
      >
        <div
          class="flex justify-start items-center gap-3"
        >
          <div
            v-if="organization.logo"
            class="w-8 h-8 rounded-md border border-gray-200 p-1.5"
          >
            <img
              :src="organization.logo"
              :alt="`${organization.displayName} logo`"
            />
          </div>
          <div
            class="text-xs text-gray-900 group-hover:text-brand-500 transition"
          >
            {{ organization.displayName }}
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { computed } from 'vue';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);
</script>

<script>
export default {
  name: 'AppMemberAsideOrganizations',
};
</script>
