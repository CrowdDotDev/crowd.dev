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
          query: { projectGroup: selectedProjectGroup?.id },
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
        v-for="{
          id,
          logo,
          name,
          displayName,
          memberOrganizations,
        } of member.organizations"
        :key="id"
        :to="{
          name: 'organizationView',
          params: {
            id,
          },
          query: { projectGroup: selectedProjectGroup?.id },
        }"
        class="group hover:cursor-pointer"
      >
        <div
          class="flex justify-start gap-3"
          :class="{
            'items-center': !hasValues(memberOrganizations),
          }"
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
            <i
              v-else
              class="ri-community-line text-base text-gray-300"
            />
          </div>
          <div class="flex flex-col gap-1">
            <div
              class="text-xs text-gray-900 group-hover:text-brand-500 transition font-medium"
            >
              {{ displayName || name }}
            </div>
            <div v-if="hasValues(memberOrganizations)" class="text-gray-600 text-2xs">
              <span v-if="memberOrganizations.title">{{ memberOrganizations.title }}</span>
              <span v-if="memberOrganizations.dateStart || memberOrganizations.dateEnd">
                <span v-if="memberOrganizations.title" class="mx-1">•</span>
                <span>
                  {{ memberOrganizations.dateStart
                    ? moment(memberOrganizations.dateStart).utc().format('MMMM YYYY')
                    : 'Unkown' }}
                </span>
                <span class="mx-1 whitespace-nowrap">-></span>
                <span>
                  {{ memberOrganizations.dateEnd
                    ? moment(memberOrganizations.dateEnd).utc().format('MMMM YYYY')
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
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const { currentTenant, currentUser } = mapGetters('auth');

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);

const hasValues = (organizations) => Object.values(organizations || {}).some((v) => !!v);
</script>
