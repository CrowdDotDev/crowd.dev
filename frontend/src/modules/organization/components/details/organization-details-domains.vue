<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-5">
      <h6 class="text-h6">
        Domains
      </h6>
      <lf-button
        v-if="hasPermission(LfPermission.organizationEdit)"
        type="secondary"
        size="small"
        :icon-only="true"
        @click="edit = true"
      >
        <lf-icon name="pencil-line" />
      </lf-button>
    </div>
    <div class="flex flex-col gap-6">
      <lf-organization-details-domains-section
        :domains="primaryDomains(props.organization)"
      >
        Primary domain
      </lf-organization-details-domains-section>

      <lf-organization-details-domains-section
        :domains="alternativeDomains(props.organization)"
      >
        Alternative domains
      </lf-organization-details-domains-section>

      <lf-organization-details-domains-section
        :domains="affiliatedProfiles(props.organization)"
      >
        Affiliated domains
      </lf-organization-details-domains-section>
    </div>

    <div v-if="!domains(props.organization).length" class="pt-2 flex flex-col items-center w-full">
      <lf-icon name="link" :size="40" class="text-gray-300" />
      <p class="text-center pt-3 text-medium text-gray-400">
        No domains
      </p>
    </div>
  </section>
  <app-organization-manage-domains-drawer
    v-if="edit"
    v-model="edit"
    :organization="organization"
    @reload="emit('reload')"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { ref } from 'vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import { Organization } from '@/modules/organization/types/Organization';
import LfOrganizationDetailsDomainsSection
  from '@/modules/organization/components/details/domains/organization-details-domains-section.vue';
import AppOrganizationManageDomainsDrawer
  from '@/modules/organization/components/organization-manage-domains-drawer.vue';

const props = defineProps<{
  organization: Organization,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const { hasPermission } = usePermissions();

const {
  primaryDomains, alternativeDomains,
  affiliatedProfiles, domains,
} = useOrganizationHelpers();

const edit = ref<boolean>(false);
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsDomains',
};
</script>
