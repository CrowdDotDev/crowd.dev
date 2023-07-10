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

    <div
      v-if="member.organizations.length"
      class="flex flex-col gap-4 mt-6"
    >
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
          class="flex justify-start gap-3"
        >
          <div
            class="w-6 h-6 rounded-md border border-gray-200 p-0.5 flex items-center justify-center overflow-hidden"
            :class="{
              'bg-white': organization.logo,
              'bg-gray-50': !organization.logo,
            }"
          >
            <img
              v-if="organization.logo"
              :src="organization.logo"
              :alt="`${organization.displayName} logo`"
            />
            <i
              v-else
              class="ri-community-line text-base text-gray-300"
            />
          </div>
          <div class="flex flex-col gap-1">
            <div
              class="text-xs text-gray-900 group-hover:text-brand-500 transition font-medium"
            >
              {{ organization.displayName }}
            </div>
            <div v-if="organization.memberOrganizations" class="text-gray-600 text-3xs">
              <span v-if="organization.memberOrganizations.title">{{ organization.memberOrganizations.title }}</span>
              <span v-if="organization.memberOrganizations.dateStart || organization.memberOrganizations.dateEnd">
                <span class="mx-1">•</span>
                <span>
                  {{ organization.memberOrganizations.dateStart
                    ? moment(organization.memberOrganizations.dateStart).utc().format('MMM YYYY')
                    : 'Unkown' }}
                </span>
                <span class="mx-1">-></span>
                <span>
                  {{ organization.memberOrganizations.dateEnd
                    ? moment(organization.memberOrganizations.dateEnd).utc().format('MMM YYYY')
                    : 'Present' }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </router-link>
    </div>
    <div v-else class="text-gray-400 mt-6 text-sm">
      No organizations
    </div>
  </div>
</template>

<script setup lang="ts">
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { computed } from 'vue';
import moment from 'moment';

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
