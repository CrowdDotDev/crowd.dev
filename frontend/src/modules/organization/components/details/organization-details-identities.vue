<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Identities
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

    <div class="flex flex-col gap-4">
      <article
        v-for="identity of identityList.slice(0, showMore ? identityList.length : 10)"
        :key="`${identity.platform}-${identity.value}`"
        class="flex items-center"
      >
        <lf-tooltip v-if="platform(identity.platform)" placement="top-start" :content="platform(identity.platform).name">
          <img
            :src="platform(identity.platform)?.image"
            class="h-5 w-5 object-contain"
            :alt="identity.value"
          />
        </lf-tooltip>
        <lf-tooltip v-else content="Custom identity" placement="top-start">
          <lf-icon
            name="fingerprint-fill"
            :size="20"
            class="text-gray-600"
          />
        </lf-tooltip>
        <div class="pl-3 flex items-center">
          <p v-if="!identity.url" class="text-medium max-w-48 truncate">
            {{ identity.value }}
          </p>
          <a
            v-else
            :href="identity.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 max-w-48 truncate"
          >
            {{ identity.value }}
          </a>
          <p v-if="!platform(identity.platform)" class="text-medium text-gray-400 ml-1">
            {{ identity.platform }}
          </p>
        </div>
        <lf-tooltip v-if="identity.verified" content="Verified identity">
          <lf-icon
            name="verified-badge-line"
            :size="16"
            class="ml-1 text-primary-500"
          />
        </lf-tooltip>
      </article>
      <div v-if="identities.length === 0" class="pt-2 flex flex-col items-center w-full">
        <lf-icon name="fingerprint-fill" :size="40" class="text-gray-300" />
        <p class="text-center pt-3 text-medium text-gray-400">
          No identities
        </p>
      </div>
    </div>

    <lf-button
      v-if="identityList.length > 10"
      type="primary-link"
      size="medium"
      class="mt-6"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less' : 'more' }}
    </lf-button>
  </section>
  <app-organization-manage-identities-drawer
    v-if="edit"
    v-model="edit"
    :organization="props.organization"
    @unmerge="unmerge"
    @reload="emit('reload')"
  />
  <app-organization-unmerge-dialog
    v-if="isUnmergeDialogOpen"
    v-model="isUnmergeDialogOpen"
    :selected-identity="selectedIdentity"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { computed, ref } from 'vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import { Organization } from '@/modules/organization/types/Organization';
import AppOrganizationManageIdentitiesDrawer
  from '@/modules/organization/components/organization-manage-identities-drawer.vue';
import AppOrganizationUnmergeDialog from '@/modules/organization/components/organization-unmerge-dialog.vue';

const props = defineProps<{
  organization: Organization,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const { hasPermission } = usePermissions();

const { identities } = useOrganizationHelpers();

const identityList = computed(() => identities(props.organization));

const showMore = ref<boolean>(false);
const edit = ref<boolean>(false);
const isUnmergeDialogOpen = ref(null);
const selectedIdentity = ref(null);
const platform = (name: string) => CrowdIntegrations.getConfig(name);

const unmerge = (identity: any) => {
  if (identity) {
    selectedIdentity.value = identity;
  }
  isUnmergeDialogOpen.value = props.organization as any;
};
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsIdentities',
};
</script>
