<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Work history
      </h6>
      <lf-button
        v-if="hasPermission(LfPermission.memberEdit)"
        type="secondary"
        size="small"
        :icon-only="true"
        @click="edit = true"
      >
        <lf-icon name="pencil-line" />
      </lf-button>
    </div>

    <div class="flex flex-col gap-4">
      <article v-for="org of orgs.slice(0, showMore ? orgs.length : 3)" :key="org.id">
        <div class="flex">
          <lf-avatar
            :name="org.displayName"
            :src="org.logo"
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
            <router-link
              :to="{
                name: 'organizationView',
                params: {
                  id: org.id,
                },
                query: {
                  projectGroup: selectedProjectGroup?.id,
                },
              }"
            >
              <p class="font-semibold text-medium leading-6 mb-1 line-clamp-1 truncate text-black hover:text-primary-500 transition">
                {{ org.displayName }}
              </p>
            </router-link>

            <div v-if="org?.memberOrganizations?.title" class="text-small text-gray-500 mb-1.5 flex items-center gap-1.5">
              <lf-svg name="id-card" class="h-4 w-4 text-gray-400" />
              <p class="line-clamp-1 truncate">
                {{ org?.memberOrganizations?.title }}
              </p>
            </div>
            <p class="text-small text-gray-500 mb-1.5 flex items-center">
              <lf-icon name="calendar-line" :size="16" class="mr-1.5 text-gray-400" />
              {{ getDateRange(org?.memberOrganizations?.dateStart, org?.memberOrganizations?.dateEnd) }}
            </p>
          </div>
        </div>
      </article>
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
  <app-member-form-organizations-drawer
    v-if="edit"
    v-model="edit"
    :member="props.contributor"
    @update:model-value="emit('reload')"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { computed, ref } from 'vue';
import AppMemberFormOrganizationsDrawer from '@/modules/member/components/form/member-form-organizations-drawer.vue';
import LfSvg from '@/shared/svg/svg.vue';
import moment from 'moment/moment';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const props = defineProps<{
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const lfStore = useLfSegmentsStore();
const { selectedProjectGroup } = lfStore;

const { hasPermission } = usePermissions();

const showMore = ref<boolean>(false);
const edit = ref<boolean>(false);

const orgs = computed(() => props.contributor.organizations);

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
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsWorkHistory',
};
</script>
