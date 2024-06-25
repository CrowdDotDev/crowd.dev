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
      <el-button
        v-if="hasPermission(LfPermission.organizationEdit)"
        class="btn btn-link btn-link--primary"
        @click="identitiesDrawer = true"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
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
            v-if="!Object.keys(identities.getIdentities())?.length && hasPermission(LfPermission.organizationEdit)"
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
            :domains="identities.getDomains()"
            :affiliated-profiles="identities.getAffiliatedProfiles()"
            :phone-numbers="identities.getPhoneNumbers()"
            @edit-emails="emailsDrawer = true"
            @edit-domains="domainsDrawer = true"
            @edit-phone-number="phoneNumberDrawer = true"
          />
        </template>
      </app-identities-vertical-list-organizations>
    </div>
  </div>
  <app-organization-manage-identities-drawer
    v-if="identitiesDrawer"
    v-model="identitiesDrawer"
    :organization="organization"
    @unmerge="emit('unmerge', $event)"
  />
  <app-organization-manage-emails-drawer
    v-if="emailsDrawer"
    v-model="emailsDrawer"
    :organization="organization"
  />
  <app-organization-manage-domains-drawer
    v-if="domainsDrawer"
    v-model="domainsDrawer"
    :organization="organization"
  />
  <app-organization-manage-phone-numbers-drawer
    v-if="phoneNumberDrawer"
    v-model="phoneNumberDrawer"
    :organization="organization"
  />
</template>

<script setup lang="ts">
import {
  ref,
} from 'vue';
import AppIdentitiesVerticalListOrganizations from '@/shared/modules/identities/components/identities-vertical-list-organizations.vue';
import organizationOrder from '@/shared/modules/identities/config/identitiesOrder/organization';
import { Organization } from '@/modules/organization/types/Organization';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppOrganizationManageIdentitiesDrawer
  from '@/modules/organization/components/organization-manage-identities-drawer.vue';
import AppOrganizationManageEmailsDrawer from '@/modules/organization/components/organization-manage-emails-drawer.vue';
import AppOrganizationManagePhoneNumbersDrawer
  from '@/modules/organization/components/organization-manage-phone-numbers-drawer.vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import AppOrganizationManageDomainsDrawer from '@/modules/organization/components/organization-manage-domains-drawer.vue';
import AppAsideIdentitiesExtra from './_aside-identities-extra.vue';

defineProps<{
  organization: Organization
}>();

const emit = defineEmits<{(e: 'unmerge', value: any): void}>();

const { hasPermission } = usePermissions();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const route = useRoute();

const identitiesDrawer = ref<boolean>(false);
const emailsDrawer = ref<boolean>(false);
const domainsDrawer = ref<boolean>(false);
const phoneNumberDrawer = ref<boolean>(false);
</script>
