<template>
  <div class="organization-view-members">
    <div class="my-6">
      <el-input
        v-model="query"
        placeholder="Search people"
        :prefix-icon="SearchIcon"
        clearable
        class="organization-view-members-search"
      />
    </div>
    <div
      v-if="!members.length && !loading"
      class="flex items-center justify-center pt-20 pb-17"
    >
      <i
        class="ri-contacts-line flex items-center text-3xl h-12 text-gray-300"
      />
      <p
        class="text-sm leading-5 text-center italic text-gray-400 pl-6"
      >
        No people are currently working in this organization.
      </p>
    </div>
    <div v-else-if="!!members.length && !loading">
      <div>
        <div
          v-for="member in members"
          :key="member.id"
          class="py-5 border-b border-gray-200 last:border-none grid grid-cols-7 gap-4"
        >
          <div class="col-span-4 md:col-span-7 flex items-center gap-1">
            <router-link
              class="flex items-center gap-2"
              :to="{
                name: 'memberView',
                params: { id: member.id },
                query: { projectGroup: selectedProjectGroup?.id },
              }"
            >
              <app-avatar :entity="member" size="sm" />
              <app-member-display-name
                :member="member"
                custom-class="font-medium text-sm text-gray-900"
              />
            </router-link>

            <span class="text-xs text-gray-400 font-medium">・</span>

            <app-member-engagement-level
              :member="member"
            />
          </div>
          <div class="col-span-3 md:col-span-7 flex items-center justify-end md:justify-start">
            <app-identities-horizontal-list-members
              :member="member"
              :limit="5"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      v-loading="loading"
      class="app-page-spinner"
    />
    <div
      v-if="!noMore"
      class="flex justify-center pt-4"
    >
      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="loading"
        @click="fetchMembers"
      >
        <i class="ri-arrow-down-line mr-2" />Load
        more
      </el-button>
    </div>
  </div>
</template>

<script setup>
import isEqual from 'lodash/isEqual';
import {
  reactive,
  ref,
  h,
  onMounted,
  watch,
} from 'vue';
import debounce from 'lodash/debounce';
import authAxios from '@/shared/axios/auth-axios';
import AppMemberEngagementLevel from '@/modules/member/components/member-engagement-level.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useRoute, useRouter } from 'vue-router';
import AppIdentitiesHorizontalListMembers from '@/shared/modules/identities/components/identities-horizontal-list-members.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const route = useRoute();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const loading = ref(true);
const query = ref('');
const members = reactive([]);
const limit = ref(20);
const offset = ref(0);
const noMore = ref(false);
const router = useRouter();

let filter = {};

const fetchMembers = async () => {
  if (!router.currentRoute.value.params.id) {
    return;
  }

  const filterToApply = {
    organizations: [router.currentRoute.value.params.id],
  };

  if (query.value && query.value !== '') {
    filterToApply.or = [
      {
        displayName: {
          textContains: query.value,
        },
      },
      {
        bio: {
          textContains: query.value,
        },
      },
      {
        emails: {
          textContains: query.value,
        },
      },
    ];
  }

  if (!isEqual(filter, filterToApply)) {
    members.length = 0;
    noMore.value = false;
  }

  if (noMore.value) {
    return;
  }

  loading.value = true;

  const authStore = useAuthStore();
  const { tenant } = storeToRefs(authStore);

  const { data } = await authAxios.post(
    `/tenant/${tenant.value?.id}/member/query`,
    {
      filter: filterToApply,
      orderBy: 'joinedAt_DESC',
      limit: limit.value,
      offset: offset.value,
      segments: [route.query.segmentId || selectedProjectGroup.value.id],
    },
    {
      headers: {
        'x-crowd-api-version': '1',
      },
    },
  );

  filter = { ...filterToApply };
  loading.value = false;
  if (data.rows.length < limit.value) {
    noMore.value = true;
    members.push(...data.rows);
  } else {
    offset.value += limit.value;
    members.push(...data.rows);
  }
};

const debouncedQueryChange = debounce(async () => {
  await fetchMembers();
}, 300);

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedQueryChange();
  }
});

onMounted(async () => {
  await fetchMembers();
});
</script>

<script>
export default {
  name: 'AppMemberViewActivities',
};
</script>
