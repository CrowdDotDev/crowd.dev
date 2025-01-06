<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-5">
      <h6 class="text-h6">
        Identities
      </h6>
      <lf-contributor-details-identity-add-dropdown
        v-if="!isMasked(props.contributor) && hasPermission(LfPermission.memberEdit)"
        placement="bottom-end"
        @add="addIdentity = true; addIdentityTemplate = $event"
      >
        <lf-tooltip content="Add identity">
          <lf-button
            type="secondary"
            size="small"
            :icon-only="true"
            class="my-1"
          >
            <lf-icon name="plus" />
          </lf-button>
        </lf-tooltip>
      </lf-contributor-details-identity-add-dropdown>
    </div>

    <div v-if="!isMasked(props.contributor) && identityList.length > 0" class="flex flex-col gap-3">
      <lf-contributor-details-identity-item
        v-for="identity of identityList.slice(0, showMore ? identityList.length : 10)"
        :key="`${identity.platform}-${identity.value}`"
        :identity="identity"
        :contributor="props.contributor"
        class="min-h-7"
        @edit="editIdentity = identity"
        @unmerge="unmerge(identity.id)"
      />
    </div>

    <div v-else-if="!isMasked(props.contributor)" class="pt-2 flex flex-col items-center">
      <lf-icon name="fingerprint-fill" :size="40" class="text-gray-300" />
      <p class="text-center pt-3 text-medium text-gray-400">
        No identities
      </p>
    </div>

    <div v-else>
      <div
        v-for="i in 3"
        :key="i"
        class="h-6 mb-2 bg-gray-200 rounded-md"
      />
    </div>

    <lf-button
      v-if="!isMasked(props.contributor) && identityList.length > 10"
      type="primary-link"
      size="medium"
      class="mt-6"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less' : 'more' }}
    </lf-button>
  </section>
  <lf-contributor-identity-add
    v-if="!isMasked(props.contributor) && addIdentity && addIdentityTemplate !== null"
    v-model="addIdentity"
    :identities="[addIdentityTemplate]"
    :contributor="props.contributor"
  />
  <lf-contributor-identity-edit
    v-if="!isMasked(props.contributor) && editIdentity !== null"
    v-model="editIdentity"
    :contributor="props.contributor"
  />
  <app-member-unmerge-dialog
    v-if="!isMasked(props.contributor) && isUnmergeDialogOpen"
    v-model="isUnmergeDialogOpen"
    :selected-identity="selectedIdentity"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
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
import LfContributorIdentityEdit
  from '@/modules/contributor/components/edit/identity/contributor-identity-edit.vue';
import LfContributorIdentityAdd
  from '@/modules/contributor/components/edit/identity/contributor-identity-add.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const { hasPermission } = usePermissions();

const { identities, emails, isMasked } = useContributorHelpers();

const identityList = computed(() => [
  ...identities(props.contributor),
  ...emails(props.contributor),
]);

const showMore = ref<boolean>(false);
const isUnmergeDialogOpen = ref(null);
const selectedIdentity = ref<string | null>(null);

const addIdentity = ref<boolean>(false);
const addIdentityTemplate = ref<Partial<ContributorIdentity> | null>(null);
const editIdentity = ref<Partial<ContributorIdentity> | null>(null);
// const platform = (name: string) => CrowdIntegrations.getConfig(name);

const unmerge = (identityId: string) => {
  if (identityId) {
    selectedIdentity.value = identityId;
  }
  isUnmergeDialogOpen.value = props.contributor as any;
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentities',
};
</script>
