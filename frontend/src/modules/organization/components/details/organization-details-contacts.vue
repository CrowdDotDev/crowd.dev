<template>
  <lf-filter
    ref="memberFilter"
    v-model="filters"
    :config="filterConfig"
    :search-config="memberSearchFilter"
    :saved-views-config="memberSavedViews"
    :custom-config="customAttributesFilter"
    hash="contacts"
    @fetch="onFilterChange($event)"
  />
  <div class="flex justify-between pb-5">
    <!-- Total number -->
    <p class="text-small text-gray-500">
      {{ totalContacts }} contributors
    </p>

    <!-- Sorting -->
    <lf-dropdown placement="bottom-end">
      <template #trigger>
        <div class="flex items-center gap-1">
          <p class="text-small">
            <span class="font-semibold">
              Sort:
            </span>
            {{ sorters[sort] }}
          </p>
          <lf-icon name="arrow-down-s-line" :size="16" />
        </div>
      </template>

      <template
        v-for="(label, key) in sorters"
        :key="key"
      >
        <lf-dropdown-item
          v-if="sort !== key"
          @click="sort = key; fetch()"
        >
          {{ label }}
        </lf-dropdown-item>
      </template>
    </lf-dropdown>
  </div>

  <!-- Contact list -->
  <div>
    <article
      v-for="member of contacts"
      :key="member.id"
      class="border-b border-gray-200 py-2 flex items-center justify-between"
    >
      <router-link
        :to="{
          name: 'memberView',
          params: { id: member.id },
          query: { projectGroup: selectedProjectGroup?.id },
        }"
        class="flex items-center gap-2 group"
      >
        <div
          class="border-2 rounded-full p-0.5"
          :class="isNew(member) ? 'border-primary-500' : 'border-transparent'"
        >
          <lf-avatar
            :src="avatar(member)"
            :name="member.displayName"
            :size="32"
          />
        </div>
        <p class="text-medium font-semibold text-black group-hover:text-primary-500 transition">
          {{ member.displayName }}
        </p>
      </router-link>
      <div class="flex items-center gap-4">
        <p class="text-small text-gray-500">
          {{ member.activityCount }} activities
        </p>
        <lf-contributor-engagement-level :contributor="member" />
        <div class="h-6 flex items-center px-2 border border-gray-200 rounded-md gap-1.5">
          <lf-icon name="fingerprint-line" :size="16" />
          <p class="text-small text-gray-600">
            {{ identities(member).length }} identities
          </p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { Organization } from '@/modules/organization/types/Organization';
import { memberFilters, memberSearchFilter } from '@/modules/member/config/filters/main';
import { memberSavedViews } from '@/modules/member/config/saved-views/main';
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMemberStore } from '@/modules/member/store/pinia';
import { MemberService } from '@/modules/member/member-service';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import { Pagination } from '@/shared/types/Pagination';
import { Member } from '@/modules/member/types/Member';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import LfContributorEngagementLevel from '@/modules/contributor/components/shared/contributor-engagement-level.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const props = defineProps<{
  organization: Organization,
}>();

const filterConfig = { ...memberFilters };
delete filterConfig.organizations;

const memberStore = useMemberStore();
const { customAttributesFilter } = storeToRefs(memberStore);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const contacts = ref<Member[]>([]);
const totalContacts = ref<number>(0);
const loading = ref<boolean>(false);

const savedBody = ref<any>({});

const { avatar, isNew, identities } = useContributorHelpers();

const sorters = {
  activityCount_DESC: 'Most engaged',
  joinedAt_DESC: 'New contributors',
};

const sort = ref<string>('activityCount_DESC');

const filters = ref<Filter>({
  search: '',
  relation: 'and',
  order: {
    prop: 'activityCount',
    order: 'descending',
  },
  settings: {
    bot: 'include',
    teamMember: 'include',
    organization: 'include',
  },
});

const pagination = ref({
  page: 1,
  perPage: 20,
  total: 0,
});

const orgFilter = { organizations: { eq: props.organization.id } };

const doGetMembersCount = () => {
  MemberService.listMembers(
    {
      limit: 1,
      offset: 0,
      filter: orgFilter,
    },
    true,
  )
    .then(({ count }) => {
      totalContacts.value = count;
    });
};

const fetch = () => {
  if (!loading.value) {
    loading.value = true;
  }
  pagination.value.page = 1;
  MemberService.listMembers({
    filter: {
      and: [
        orgFilter,
        savedBody.value,
      ],
    },
    offset: 0,
    limit: pagination.value.perPage,
    orderBy: sort.value,
  })
    .then((data: Pagination<Member>) => {
      contacts.value = data.rows;
      pagination.value.total = data.count;
    })
    .catch((err) => {
      contacts.value = [];
      pagination.value.total = 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const loadMore = () => {
  pagination.value.page += 1;
  fetch();
};

const onFilterChange = (filterQuery: FilterQuery) => {
  savedBody.value = filterQuery.filter;
  pagination.value.page = 1;
  pagination.value.total = 0;
  fetch();
};
onMounted(() => {
  doGetMembersCount();
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsContacts',
};
</script>
