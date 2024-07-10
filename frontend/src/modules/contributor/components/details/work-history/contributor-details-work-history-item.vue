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

      <div class="flex-grow pl-3">
        <div class="flex justify-between">
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
          >
            <p class="font-semibold text-medium leading-6 mb-1 line-clamp-1 truncate text-black hover:text-primary-500 transition">
              {{ props.organization.displayName }}
            </p>
          </router-link>

          <lf-dropdown v-if="hovered" placement="bottom-end">
            <template #trigger>
              <lf-button type="secondary-ghost" size="small" :icon-only="true">
                <lf-icon name="more-fill" />
              </lf-button>
            </template>

            <lf-dropdown-item @click="emit('edit')">
              <lf-icon name="pencil-line" />Edit work experience
            </lf-dropdown-item>
            <lf-dropdown-separator />
            <lf-dropdown-item type="danger" @click="removeWorkHistory">
              <lf-icon name="delete-bin-6-line" />Delete work experience
            </lf-dropdown-item>
          </lf-dropdown>
        </div>

        <div v-if="props.organization?.memberOrganizations?.title" class="text-small text-gray-500 mb-1.5 flex items-center gap-1.5">
          <lf-svg name="id-card" class="h-4 w-4 text-gray-400" />
          <p class="line-clamp-1 truncate">
            {{ props.organization?.memberOrganizations?.title }}
          </p>
        </div>
        <p class="text-small text-gray-500 mb-1.5 flex items-center">
          <lf-icon name="calendar-line" :size="16" class="mr-1.5 text-gray-400" />
          {{ getDateRange(props.organization?.memberOrganizations?.dateStart, props.organization?.memberOrganizations?.dateEnd) }}
        </p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import LfSvg from '@/shared/svg/svg.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Organization, OrganizationSource } from '@/modules/organization/types/Organization';
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

const props = defineProps<{
  organization: Organization,
  contributor: Contributor
}>();

const emit = defineEmits<{(e:'edit'): void}>();

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
const { updateContributor } = useContributorStore();

const hovered = ref<boolean>(false);

const getDateRange = (dateStart?: string, dateEnd?: string) => {
  const start = dateStart
    ? moment(dateStart).utc().format('MMMM YYYY')
    : 'Unknown';
  const endDefault = dateStart ? 'Present' : 'Unknown';
  const end = dateEnd
    ? moment(dateEnd).utc().format('MMMM YYYY')
    : endDefault;
  return `${start} → ${end}`;
};

const removeWorkHistory = () => {
  const orgs = props.contributor.organizations.filter((o: Organization) => !(o.id === props.organization?.id
        && o.memberOrganizations?.title === props.organization?.memberOrganizations?.title
        && o.memberOrganizations?.dateStart === props.organization?.memberOrganizations?.dateStart
        && o.memberOrganizations?.dateEnd === props.organization?.memberOrganizations?.dateEnd))
    .map((o) => ({
      id: o.id,
      name: o.name,
      ...o.memberOrganizations?.title && {
        title: o.memberOrganizations?.title,
      },
      ...o.memberOrganizations?.dateStart && {
        startDate: o.memberOrganizations?.dateStart,
      },
      ...o.memberOrganizations?.dateEnd && {
        endDate: o.memberOrganizations?.dateEnd,
      },
      source: OrganizationSource.UI,
    }));

  updateContributor(props.contributor.id, {
    organizationsReplace: true,
    organizations: orgs,
  })
    .then(() => {
      Message.success('Work history deleted successfully');
    })
    .catch(() => {
      Message.error('Something went wrong while deleting an work history');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsWorkHistoryItem',
};
</script>
