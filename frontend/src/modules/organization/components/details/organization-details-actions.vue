<template>
  <div class="flex">
    <lf-button-group>
      <lf-button
        type="secondary"
        @click="setReportDataModal({
          organization: props.organization,
        })"
      >
        <lf-icon name="message-exclamation" class="text-red-500" /> Report data issue
      </lf-button>
      <template v-if="hasSegments">
        <!-- Merge suggestions -->
        <lf-button
          v-if="mergeSuggestionsCount > 0 && hasPermission(LfPermission.mergeOrganizations)"
          type="secondary"
          @click="isMergeSuggestionsDialogOpen = true"
        >
          <div class="bg-primary-500 text-white text-medium leading-5 px-1.5 rounded font-semibold">
            {{ mergeSuggestionsCount }}
          </div>
          {{ pluralize('Merge suggestion', mergeSuggestionsCount) }}
        </lf-button>

        <!-- Merge -->
        <lf-button v-else-if="hasPermission(LfPermission.mergeOrganizations)" type="secondary" @click="isMergeDialogOpen = props.organization">
          <lf-icon-old name="exchange-2-line" />
          Merge organization
        </lf-button>
      </template>

      <!-- Actions -->
      <lf-dropdown
        v-if="hasPermission(LfPermission.organizationEdit) || hasPermission(LfPermission.organizationDestroy)"
        class="z-20"
        placement="bottom-end"
      >
        <template #trigger>
          <lf-button
            type="secondary"
            :icon-only="true"
            :class="hasSegments && hasPermission(LfPermission.mergeOrganizations) ? '!rounded-l-none -ml-px' : ''"
          >
            <lf-icon name="ellipsis" type="regular" />
          </lf-button>
        </template>

        <lf-organization-dropdown
          :organization="props.organization"
          @reload="emit('reload')"
        />
      </lf-dropdown>
    </lf-button-group>
  </div>
  <app-organization-merge-suggestions-dialog
    v-if="isMergeSuggestionsDialogOpen"
    v-model="isMergeSuggestionsDialogOpen"
    :query="{
      filter: {
        organizationId: props.organization?.id,
      },
    }"
  />
  <app-organization-merge-dialog
    v-if="isMergeDialogOpen"
    v-model="isMergeDialogOpen"
  />
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfButtonGroup from '@/ui-kit/button/ButtonGroup.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import { computed, onMounted, ref } from 'vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { Organization } from '@/modules/organization/types/Organization';
import { OrganizationApiService } from '@/modules/organization/services/organization.api.service';
import AppOrganizationMergeSuggestionsDialog
  from '@/modules/organization/components/organization-merge-suggestions-dialog.vue';
import AppOrganizationMergeDialog from '@/modules/organization/components/organization-merge-dialog.vue';
import LfOrganizationDropdown from '@/modules/organization/components/shared/organization-dropdown.vue';
import pluralize from 'pluralize';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { useSharedStore } from '@/shared/pinia/shared.store';

const props = defineProps<{
  organization: Organization,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const { hasPermission } = usePermissions();
const { setReportDataModal } = useSharedStore();
const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const isMergeSuggestionsDialogOpen = ref<boolean>(false);
const isMergeDialogOpen = ref<Contributor | null>(null);
const mergeSuggestionsCount = ref<number>(0);

const fetchMergeSuggestions = () => {
  OrganizationApiService.fetchMergeSuggestions(0, 0, {
    filter: {
      organizationId: props.organization.id,
    },
    detail: false,
    countOnly: true,
  })
    .then(({ count }) => {
      mergeSuggestionsCount.value = +count;
    });
};

const hasSegments = computed(() => selectedProjectGroup.value?.id);

onMounted(() => {
  if (hasSegments.value) {
    fetchMergeSuggestions();
  }
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsActions',
};
</script>
