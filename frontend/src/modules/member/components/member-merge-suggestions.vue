<template>
  <div v-if="loading || count > 0" class="panel !p-0">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-5 border-b">
      <div class="flex items-center">
        <button
          v-if="Math.ceil(count) > 1"
          type="button"
          class="btn btn--transparent btn--md"
          :disabled="loading || offset <= 0"
          @click="fetch(offset - 1)"
        >
          <span class="ri-arrow-left-s-line text-lg mr-2" />
          <span>Previous</span>
        </button>
        <app-loading v-if="loading" height="16px" width="131px" radius="3px" />
        <div
          v-else-if="Math.ceil(count) > 1"
          class="text-sm leading-5 text-gray-500 flex flex-wrap justify-center px-4"
        >
          <div>{{ offset + 1 }} of {{ Math.ceil(count) }} suggestions</div>
        </div>
        <div
          v-else
          class="text-sm leading-5 text-gray-500 flex flex-wrap justify-center px-4"
        >
          <div>1 suggestion</div>
        </div>
        <button
          v-if="Math.ceil(count) > 1"
          type="button"
          class="btn btn--transparent btn--md"
          :disabled="loading || offset >= count - 1"
          @click="fetch(offset + 1)"
        >
          <span>Next</span>
          <span class="ri-arrow-right-s-line text-lg ml-2" />
        </button>
      </div>
      <div class="flex items-center">
        <div
          v-if="!loading && membersToMerge.similarity"
          class="w-full flex items-center justify-center pr-2"
        >
          <div
            class="flex text-sm"
            :style="{
              color: confidence.color,
            }"
          >
            <div class="pr-1" v-html="confidence.svg" />
            {{ Math.round(membersToMerge.similarity * 100) }}% confidence
          </div>
        </div>
        <el-button
          :disabled="loading || isEditLockedForSampleData"
          class="btn btn--bordered btn--md"
          :loading="sendingIgnore"
          @click="ignoreSuggestion()"
        >
          Ignore suggestion
        </el-button>
        <el-button
          :disabled="loading || isEditLockedForSampleData"
          class="btn btn--primary btn--md !ml-4"
          :loading="sendingMerge"
          @click="mergeSuggestion()"
        >
          Merge contacts
        </el-button>
      </div>
    </header>

    <!-- Comparison -->
    <!-- Loading -->
    <div v-if="loading" class="flex p-5">
      <div class="w-1/3 border rounded-l-lg">
        <app-member-merge-suggestions-details
          :member="null"
          :loading="true"
          :is-primary="true"
        />
      </div>
      <div class="w-1/3 -ml-px border rounded-r-lg">
        <app-member-merge-suggestions-details
          :member="null"
          :loading="true"
        />
      </div>
      <div class="w-1/3 ml-8 border rounded-lg bg-brand-25">
        <app-member-merge-suggestions-details
          :member="null"
          :loading="true"
        />
      </div>
    </div>
    <div v-else class="flex p-5">
      <div
        v-for="(member, mi) of membersToMerge.members"
        :key="member.id"
        class="w-1/3"
      >
        <app-member-merge-suggestions-details
          :member="member"
          :compare-member="
            membersToMerge.members[(mi + 1) % membersToMerge.members.length]
          "
          :is-primary="mi === primary"
          :extend-bio="bioHeight"
          class="border"
          :class="mi > 0 ? 'rounded-r-lg -ml-px' : 'rounded-l-lg'"
          @make-primary="primary = mi"
          @bio-height="$event > bioHeight ? (bioHeight = $event) : null"
        />
      </div>
      <div class="w-1/3 ml-8">
        <app-member-merge-suggestions-details
          :member="preview"
          :is-preview="true"
          class="border rounded-lg bg-brand-25"
        />
      </div>
    </div>
  </div>
  <!-- Empty state -->
  <div v-else class="pt-20 flex flex-col items-center">
    <div
      class="ri-shuffle-line text-gray-200 text-10xl h-40 flex items-center mb-8"
    />
    <h5 class="text-center text-lg font-semibold mb-4">
      No merge suggestions
    </h5>
    <p class="text-sm text-center text-gray-600 leading-5">
      We couldn’t find any duplicated contacts
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Message from '@/shared/message/message';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppMemberMergeSuggestionsDetails from '@/modules/member/components/suggestions/member-merge-suggestions-details.vue';
import { merge } from 'lodash';
import { MemberService } from '../member-service';
import { MemberPermissions } from '../member-permissions';

const props = defineProps({
  query: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const membersToMerge = ref([]);
const primary = ref(0);
const offset = ref(0);
const count = ref(0);
const loading = ref(false);

const sendingIgnore = ref(false);
const sendingMerge = ref(false);

const bioHeight = ref(0);

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

const clearMember = (member) => {
  const cleanedMember = { ...member };
  // eslint-disable-next-line no-restricted-syntax
  for (const key in cleanedMember.attributes) {
    if (!cleanedMember.attributes[key].default) {
      delete cleanedMember.attributes[key];
    }
  }
  return cleanedMember;
};

const preview = computed(() => {
  const primaryMember = membersToMerge.value.members[primary.value];
  const secondaryMember = membersToMerge.value.members[(primary.value + 1) % 2];
  const mergedMembers = merge({}, clearMember(secondaryMember), clearMember(primaryMember));
  Object.keys(mergedMembers?.username || {}).forEach((key) => {
    if (!primaryMember.username[key] || !secondaryMember.username[key]) {
      return;
    }
    mergedMembers.username[key] = [...Object.values(primaryMember.username[key]), ...Object.values(secondaryMember.username[key])];
  });
  mergedMembers.score = Math.max(primaryMember.score, secondaryMember.score);
  return mergedMembers;
});

const confidence = computed(() => {
  if (membersToMerge.value.similarity >= 0.8) {
    return {
      color: '#059669',
      svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 2.66699H17.5V17.5003H14.1667V2.66699ZM8.33337 7.5H11.6667V17.5003H8.33337V7.5Z" fill="#059669"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#059669"/>
</svg>`,
    };
  }
  if (membersToMerge.value.similarity >= 0.6) {
    return {
      color: '#3B82F6',
      svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1666 2.66699H17.4999V17.5003H14.1666V2.66699ZM8.33325 7.5H11.6666V17.5003H8.33325V7.5Z" fill="#D1D5DB"/>
<path d="M8.33325 7.5H11.6666V17.5003H8.33325V7.5Z" fill="#3B82F6"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#3B82F6"/>
</svg>`,
    };
  }
  return {
    color: '#D97706',
    svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 2.66699H17.5V17.5003H14.1667V2.66699ZM8.33337 7.5H11.6667V17.5003H8.33337V7.5Z" fill="#D1D5DB"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#F59E0B"/>
</svg>`,
  };
});

const fetch = (page) => {
  if (page > -1) {
    offset.value = page;
  }
  loading.value = true;

  MemberService.fetchMergeSuggestions(1, offset.value, props.query ?? {})
    .then((res) => {
      offset.value = +res.offset;
      count.value = res.count;
      [membersToMerge.value] = res.rows;

      const { members } = membersToMerge.value;

      primary.value = 0;

      // Set member with maximum identities and activities as primary
      if (members.length >= 2 && ((members[0].identities.length < members[1].identities.length)
        || (members[0].activityCount < members[1].activityCount))) {
        membersToMerge.value.members.reverse();
      }
    })
    .catch(() => {
      Message.error(
        'There was an error fetching merge suggestion, please try again later',
      );
    })
    .finally(() => {
      loading.value = false;
    });
};

const ignoreSuggestion = () => {
  if (sendingIgnore.value || sendingMerge.value || loading.value) {
    return;
  }
  sendingIgnore.value = true;
  MemberService.addToNoMerge(...membersToMerge.value.members)
    .then(() => {
      Message.success('Merging suggestion ignored successfuly');
      fetch();
    })
    .catch((error) => {
      if (error.response.status === 404) {
        Message.error('Suggestion already merged or ignored', {
          message: `Sorry, the suggestion you are trying to merge might have already been merged or ignored.
          Please refresh to see the updated information.`,
        });
      } else {
        Message.error('There was an error ignoring the merging suggestion');
      }
    })
    .finally(() => {
      sendingIgnore.value = false;
    });
};

const mergeSuggestion = () => {
  if (sendingIgnore.value || sendingMerge.value || loading.value) {
    return;
  }
  sendingMerge.value = true;
  MemberService.merge(
    membersToMerge.value.members[primary.value],
    membersToMerge.value.members[(primary.value + 1) % 2],
  )
    .then(() => {
      primary.value = 0;
      Message.success('Contacts merged successfuly');
      fetch();
    })
    .catch((error) => {
      if (error.response.status === 404) {
        Message.success('Contacts already merged or deleted', {
          message: `Sorry, the contacts you are trying to merge might have already been merged or deleted.
          Please refresh to see the updated information.`,
        });
      } else {
        Message.error('There was an error merging contacts');
      }
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

onMounted(async () => {
  fetch(0);
});
</script>

<script>
export default {
  name: 'AppMemberMergeSuggestions',
};
</script>
