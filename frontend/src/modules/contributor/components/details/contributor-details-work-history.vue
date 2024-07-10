<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Work history
      </h6>
      <lf-tooltip
        v-if="hasPermission(LfPermission.memberEdit)"
        content="Add work experience"
        content-class="-ml-5"
      >
        <lf-button
          type="secondary"
          size="small"
          :icon-only="true"
          @click="isEditModalOpen = true; editOrganization = null"
        >
          <lf-icon name="add-fill" />
        </lf-button>
      </lf-tooltip>
    </div>

    <div class="flex flex-col gap-4">
      <lf-contributor-details-work-history-item
        v-for="org of orgs.slice(0, showMore ? orgs.length : 3)"
        :key="org.id"
        :contributor="props.contributor"
        :organization="org"
        @edit="isEditModalOpen = true; editOrganization = org"
      />
      <div v-if="orgs.length === 0" class="pt-2 flex flex-col items-center">
        <lf-icon name="survey-line" :size="40" class="text-gray-300" />
        <p class="text-center pt-3 text-medium text-gray-400">
          No work experiences
        </p>
      </div>
    </div>

    <lf-button
      v-if="orgs.length > 3"
      type="primary-link"
      size="medium"
      class="mt-6"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less' : 'more' }}
    </lf-button>
  </section>
  <!--  <app-member-form-organizations-drawer-->
  <!--    v-if="isEditModalOpen"-->
  <!--    v-model="isEditModalOpen"-->
  <!--    :member="props.contributor"-->
  <!--    @update:model-value="emit('reload')"-->
  <!--  />-->

  <lf-contributor-edit-work-history
    v-if="isEditModalOpen"
    v-model="isEditModalOpen"
    :organization="editOrganization"
    :contributor="props.contributor"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { computed, ref } from 'vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfContributorEditWorkHistory
  from '@/modules/contributor/components/edit/work-history/contributor-work-history-edit.vue';
import { Organization } from '@/modules/organization/types/Organization';
import LfContributorDetailsWorkHistoryItem
  from '@/modules/contributor/components/details/work-history/contributor-details-work-history-item.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const { hasPermission } = usePermissions();

const showMore = ref<boolean>(false);
const isEditModalOpen = ref<boolean>(false);
const editOrganization = ref<Organization | null>(null);

const orgs = computed(() => props.contributor.organizations);
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsWorkHistory',
};
</script>
