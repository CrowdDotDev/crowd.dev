<template>
  <div class="px-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <div class="font-medium text-black">
          Identities
        </div>
        <el-tooltip placement="top">
          <template #content>
            Identities can be profiles on social platforms, emails,<br>
            or unique identifiers from internal sources.
          </template>
          <span>
            <i class="ri-information-line text-xs" />
          </span>
        </el-tooltip>
      </div>
    </div>
    <div class="-mx-6 mt-6">
      <app-identities-vertical-list-organizations
        :organization="organization"
        :order="organizationOrder.profile"
        :x-padding="6"
        :display-show-more="true"
      >
        <template #default="{ identities }">
          <div
            v-if="!Object.keys(identities.getIdentities())?.length"
            class="text-sm text-gray-600 px-6 pt-6"
          >
            <router-link
              :to="{
                name: 'organizationEdit',
                params: { id: organization.id },
                query: {
                  projectGroup: selectedProjectGroup?.id,
                  segmentId: route.query.segmentId || selectedProjectGroup?.id,
                },
              }"
            >
              Add identities
            </router-link>
          </div>

          <app-aside-identities-extra
            :emails="identities.getEmails()"
            :phone-numbers="identities.getPhoneNumbers()"
          />
        </template>
      </app-identities-vertical-list-organizations>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defineProps,
} from 'vue';
import AppIdentitiesVerticalListOrganizations from '@/shared/modules/identities/components/identities-vertical-list-organizations.vue';
import organizationOrder from '@/shared/modules/identities/config/identitiesOrder/organization';
import { Organization } from '@/modules/organization/types/Organization';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppAsideIdentitiesExtra from './_aside-identities-extra.vue';

defineProps<{
  organization: Organization
}>();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const route = useRoute();
</script>
