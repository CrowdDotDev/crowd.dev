<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="font-medium text-black mr-2">
        Organizations
      </div>

      <el-button
        v-if="hasPermission(LfPermission.memberEdit)"
        class="btn btn-link btn-link--linux"
        @click="isOrganizationDrawerOpen = true"
      >
        <i class="ri-pencil-line text-lg" />
      </el-button>
    </div>

    <div
      v-if="member.organizations.length"
      class="flex flex-col gap-4 mt-6"
    >
      <app-entities
        :entities="member.organizations"
        :limit="3"
      >
        <template #default="{ slicedEntities }">
          <router-link
            v-for="{
              id,
              logo,
              name,
              displayName,
              memberOrganizations,
            } of (slicedEntities as Organization[])"
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
                <div class="flex gap-2 items-center">
                  <div
                    class="text-xs text-gray-900 group-hover:text-primary-500 transition font-medium"
                  >
                    {{ displayName || name }}
                  </div>
                  <el-tooltip
                    v-if="memberOrganizations?.source"
                    :content="getSource(memberOrganizations?.source)"
                    placement="top"
                    trigger="hover"
                  >
                    <app-svg name="source" class="h-3 w-3" />
                  </el-tooltip>
                </div>
                <div v-if="hasValues(memberOrganizations)" class="text-gray-600 text-2xs">
                  <span v-if="memberOrganizations.title">
                    {{ memberOrganizations.title }}
                  </span>
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
          </router-link>
        </template>
      </app-entities>
    </div>
    <div v-else class="text-gray-400 mt-6 text-xs italic">
      No organizations
    </div>
  </div>
  <app-member-form-organizations-drawer v-if="member && isOrganizationDrawerOpen" v-model="isOrganizationDrawerOpen" :member="member" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import moment from 'moment';
import AppMemberFormOrganizationsDrawer from '@/modules/member/components/form/member-form-organizations-drawer.vue';
import { Member } from '@/modules/member/types/Member';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppSvg from '@/shared/svg/svg.vue';
import AppEntities from '@/shared/modules/entities/Entities.vue';
import { Organization, OrganizationSource } from '@/modules/organization/types/Organization';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';

const OrganizationSourceValue = {
  [OrganizationSource.EMAIL_DOMAIN]: 'Email domain',
  [OrganizationSource.ENRICHMENT]: 'Enrichment',
  [OrganizationSource.HUBSPOT]: 'HubSpot',
  [OrganizationSource.GITHUB]: 'GitHub',
  [OrganizationSource.UI]: 'Custom',
};

defineProps<{
  member: Member
}>();

const { hasPermission } = usePermissions();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const isOrganizationDrawerOpen = ref<boolean>(false);

const hasValues = (organizations: {
  title: string,
  dateEnd: string,
  dateStart: string
}) => Object.values(organizations || {});

const getSource = (source: OrganizationSource) => OrganizationSourceValue[source];
</script>
