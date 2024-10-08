<template>
  <article
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="flex">
      <lf-avatar
        :name="props.organization.displayName"
        :src="props.organization.logo"
        :size="24"
        class="!rounded-md border border-gray-200 min-w-6"
        img-class="!object-contain"
      >
        <template #placeholder>
          <div class="w-full h-full bg-gray-50 flex items-center justify-center">
            <lf-icon name="community-line" :size="16" class="text-gray-400" />
          </div>
        </template>
      </lf-avatar>

      <div class="pl-3 flex flex-auto flex-col overflow-hidden">
        <router-link
          :to="{
            name: 'organizationView',
            params: {
              id: props.organization.id,
            },
            query: {
              projectGroup: selectedProjectGroup?.id,
            },
          }"
          class="font-semibold text-medium leading-6 mb-1 truncate text-black hover:text-primary-500 transition block w-full overflow-hidden"
        >
          {{ props.organization.displayName }}
        </router-link>

        <div v-if="props.organization?.memberOrganizations?.title" class="text-small text-gray-500 mb-1.5 flex items-center gap-1.5">
          <lf-svg name="id-card" class="h-4 w-4 text-gray-400" />
          <p class="truncate" style="max-width: 30ch">
            {{ props.organization?.memberOrganizations?.title }}
          </p>
        </div>
        <p class="text-small text-gray-500 mb-1.5 flex items-center">
          <lf-icon name="calendar-line" :size="16" class="mr-1.5 text-gray-400" />
          {{ getDateRange(props.organization?.memberOrganizations?.dateStart, props.organization?.memberOrganizations?.dateEnd) }}
        </p>
      </div>

      <lf-dropdown v-if="hovered" placement="bottom-end" width="14.5rem">
        <template #trigger>
          <lf-button type="secondary-ghost" size="small" :icon-only="true">
            <lf-icon name="more-fill" />
          </lf-button>
        </template>

        <lf-dropdown-item v-if="hasPermission(LfPermission.memberEdit)" @click="emit('edit')">
          <lf-icon name="pencil-line" />Edit work experience
        </lf-dropdown-item>
        <lf-dropdown-item
          @click="setReportDataModal({
            contributor: props.contributor,
            type: ReportDataType.WORK_EXPERIENCE,
            attribute: props.organization,
          })"
        >
          <lf-icon name="feedback-line" class="!text-red-500" />Report issue
        </lf-dropdown-item>
        <template v-if="hasPermission(LfPermission.memberEdit)">
          <lf-dropdown-separator />
          <lf-dropdown-item type="danger" @click="removeWorkHistory">
            <lf-icon name="delete-bin-6-line" />Delete work experience
          </lf-dropdown-item>
        </template>
      </lf-dropdown>
    </div>
  </article>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import LfSvg from '@/shared/svg/svg.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Organization } from '@/modules/organization/types/Organization';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import { ref } from 'vue';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import Message from '@/shared/message/message';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { useSharedStore } from '@/shared/pinia/shared.store';
import { ReportDataType } from '@/shared/modules/report-issue/constants/report-data-type.enum';

const props = defineProps<{
  organization: Organization,
  contributor: Contributor
}>();

const emit = defineEmits<{(e:'edit'): void}>();

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
const { deleteContributorOrganization } = useContributorStore();
const { trackEvent } = useProductTracking();

const { hasPermission } = usePermissions();
const { setReportDataModal } = useSharedStore();

const hovered = ref<boolean>(false);

const getDateRange = (dateStart?: string, dateEnd?: string) => {
  const start = dateStart
    ? moment(dateStart).utc().format('MMMM YYYY')
    : 'Unknown';
  const endDefault = dateStart ? 'Present' : 'Unknown';
  const end = dateEnd
    ? moment(dateEnd).utc().format('MMMM YYYY')
    : endDefault;
  if (start === end) {
    return start;
  }
  return `${start} → ${end}`;
};

const removeWorkHistory = () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete work experience',
    message: "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'ri-delete-bin-line',
  }).then(() => {
    trackEvent({
      key: FeatureEventKey.DELETE_WORK_EXPERIENCE,
      type: EventType.FEATURE,
      properties: {
      },
    });

    deleteContributorOrganization(props.contributor.id, props.organization.memberOrganizations.id)
      .then(() => {
        Message.success('Work experience deleted successfully');
      })
      .catch(() => {
        Message.error('Something went wrong while deleting an work experience');
      });
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsWorkHistoryItem',
};
</script>
