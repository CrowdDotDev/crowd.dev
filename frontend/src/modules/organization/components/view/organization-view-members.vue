<template>
  <div class="organization-view-members">
    <div
      v-if="members.length === 0"
      class="flex items-center justify-center pt-20 pb-17"
    >
      <i
        class="ri-contacts-line flex items-center text-3xl h-12 text-gray-300"
      />
      <p
        class="text-sm leading-5 text-center italic text-gray-400 pl-6"
      >
        Members can take up to two minutes to appear in the
        list
      </p>
    </div>
    <div v-else>
      <div class="my-6">
        <el-input
          v-model="query"
          placeholder="Search members"
          :prefix-icon="SearchIcon"
          clearable
          class="organization-view-members-search"
        />
      </div>
      <div>
        <div
          v-for="member in members"
          :key="member.id"
          class="flex flex-wrap items-center justify-between py-5 border-b border-gray-200 last:border-none gap-2"
        >
          <div class="basis-2/6">
            <router-link
              class="flex items-center gap-2"
              :to="{
                name: 'memberView',
                params: { id: member.id },
              }"
            >
              <app-avatar :entity="member" size="sm" />
              <app-member-display-name
                :member="member"
                custom-class="font-medium text-sm text-gray-900"
              />
            </router-link>
          </div>
          <div
            class="flex items-center justify-between gap-6 basis-3/6 mr-2"
          >
            <div>
              <app-member-engagement-level
                :member="member"
              />
            </div>
            <app-member-identities
              :username="member.username"
              :member="member"
            />
          </div>
        </div>
        <div
          v-if="loading"
          v-loading="loading"
          class="app-page-spinner"
        />
        <div
          v-if="!noMore"
          class="flex justify-center pt-4"
        >
          <el-button
            class="btn btn-brand btn-brand--transparent"
            :disabled="loading"
            @click="fetchMembers"
          >
            <i class="ri-arrow-down-line mr-2" />Load
            more
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import isEqual from 'lodash/isEqual';
import { useStore } from 'vuex';
import {
  defineProps,
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
import AppMemberIdentities from '@/modules/member/components/member-identities.vue';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const store = useStore();
const props = defineProps({
  organizationId: {
    type: String,
    default: null,
  },
});

const loading = ref(true);
const query = ref('');
const members = reactive([]);
const limit = ref(20);
const offset = ref(0);
const noMore = ref(false);

let filter = {};

const fetchMembers = async () => {
  const filterToApply = {
    organizations: [props.organizationId],
  };

  if (query.value && query.value !== '') {
    filterToApply.or = [
      {
        name: {
          textContains: query.value,
        },
      },
      {
        bio: {
          textContains: query.value,
        },
      },
      {
        email: {
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

  const { data } = await authAxios.post(
    `/tenant/${store.getters['auth/currentTenant'].id}/member/query`,
    {
      filter: filterToApply,
      orderBy: 'joinedAt_DESC',
      limit: limit.value,
      offset: offset.value,
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
