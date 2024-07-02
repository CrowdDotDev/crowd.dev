<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-5">
      <h6 class="text-h6">
        Identities
      </h6>
      <lf-contributor-details-identity-add-dropdown
        v-if="hasPermission(LfPermission.memberEdit)"
        placement="bottom-end"
        @add="edit = true; editIdentity = $event"
      >
        <lf-tooltip content="Add identity">
          <lf-button
            type="secondary"
            size="small"
            :icon-only="true"
            class="my-1"
          >
            <lf-icon name="add-fill" />
          </lf-button>
        </lf-tooltip>
      </lf-contributor-details-identity-add-dropdown>
    </div>

    <div class="flex flex-col gap-4">
      <lf-contributor-details-identity-item
        v-for="identity of identityList.slice(0, showMore ? identityList.length : 10)"
        :key="`${identity.platform}-${identity.value}`"
        :identity="identity"
        class="flex items-center"
        @edit="edit = true; editIdentity = identity"
      />

      <div v-if="identities.length === 0" class="pt-2 flex flex-col items-center">
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
  <lf-contributor-details-identity-edit
    v-if="edit"
    v-model="edit"
    :identity="editIdentity"
  />
  <app-member-unmerge-dialog
    v-if="isUnmergeDialogOpen"
    v-model="isUnmergeDialogOpen"
    :selected-identity="selectedIdentity"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import { computed, ref } from 'vue';
import AppMemberUnmergeDialog from '@/modules/member/components/member-unmerge-dialog.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import LfContributorDetailsIdentityItem
  from '@/modules/contributor/components/details/identity/contributor-details-identity-item.vue';
import LfContributorDetailsIdentityAddDropdown
  from '@/modules/contributor/components/details/identity/contributor-details-identity-add-dropdown.vue';
import LfContributorDetailsIdentityEdit
  from '@/modules/contributor/components/details/identity/contributor-details-identity-edit.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const { hasPermission } = usePermissions();

const { identities, emails } = useContributorHelpers();

const identityList = computed(() => [
  ...identities(props.contributor),
  ...emails(props.contributor),
]);

const showMore = ref<boolean>(false);
const isUnmergeDialogOpen = ref(null);
const selectedIdentity = ref(null);

const edit = ref<boolean>(false);
const editIdentity = ref<Partial<ContributorIdentity> | null>(null);
// const platform = (name: string) => CrowdIntegrations.getConfig(name);

// const unmerge = (identity: any) => {
//   if (identity) {
//     selectedIdentity.value = identity;
//   }
//   isUnmergeDialogOpen.value = props.contributor as any;
// };
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentities',
};
</script>
