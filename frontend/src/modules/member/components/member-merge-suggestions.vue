<template>
  <div class="panel !p-0">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-5 border-b">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <lf-button
            type="secondary"
            size="small"
            :disabled="loading || offset <= 0 || count === 0"
            :icon-only="true"
            @click="fetch(offset - 1)"
          >
            <i class="ri-arrow-left-s-line" />
          </lf-button>
          <lf-button
            type="secondary"
            size="small"
            :disabled="loading || offset >= count - 1 || count === 0"
            :icon-only="true"
            @click="fetch(offset + 1)"
          >
            <i class="ri-arrow-right-s-line" />
          </lf-button>
        </div>

        <app-loading v-if="loading" height="16px" width="128px" radius="3px" />
        <div
          v-else-if="Math.ceil(count) > 1"
          class="text-xs leading-5 text-gray-500"
        >
          <div>{{ offset + 1 }} of {{ Math.ceil(count) }} suggestions</div>
        </div>
        <div
          v-else-if="Math.ceil(count) === 1"
          class="text-xs leading-5 text-gray-500"
        >
          <div>1 suggestion</div>
        </div>
        <div
          v-else
          class="text-xs leading-5 text-gray-500"
        >
          <div>0 suggestions</div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <app-member-merge-similarity v-if="!loading && membersToMerge.similarity" :similarity="membersToMerge.similarity" />
        <lf-button
          type="secondary"
          :disabled="loading || isEditLockedForSampleData || count === 0"
          :loading="sendingIgnore"
          @click="ignoreSuggestion()"
        >
          Ignore suggestion
        </lf-button>
        <lf-button
          type="primary"
          :disabled="loading || isEditLockedForSampleData || count === 0"
          :loading="sendingMerge"
          @click="mergeSuggestion()"
        >
          Merge profile
        </lf-button>
        <slot name="actions" />
      </div>
    </header>

    <div v-if="loading || count > 0">
      <!-- Comparison -->
      <!-- Loading -->
      <div v-if="loading" class="flex p-5">
        <div class="w-1/3 rounded-lg">
          <app-member-merge-suggestions-details
            :member="null"
            :loading="true"
            :is-primary="true"
          />
        </div>
        <div class="w-1/3 -ml-px rounded-lg">
          <app-member-merge-suggestions-details
            :member="null"
            :loading="true"
          />
        </div>
        <div class="w-1/3 ml-8 rounded-lg bg-primary-25">
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
            class="rounded-lg"
            :class="mi > 0 ? '-ml-px' : ''"
            @make-primary="primary = mi"
            @bio-height="$event > bioHeight ? (bioHeight = $event) : null"
          />
        </div>
        <div class="w-1/3 ml-8">
          <app-member-merge-suggestions-details
            :member="preview"
            :is-preview="true"
            class="rounded-lg bg-primary-25"
          />
        </div>
      </div>
    </div>
    <!-- Empty state -->
    <div v-else class="py-20 flex flex-col items-center">
      <div
        class="ri-shuffle-line text-gray-200 text-10xl h-40 flex items-center mb-8"
      />
      <h5 class="text-center text-lg font-semibold mb-4">
        No merge suggestions
      </h5>
      <p class="text-sm text-center text-gray-600 leading-5">
        We couldn't find any duplicated profiles
      </p>
    </div>
  </div>
</template>

<script setup>
import {
  ref, onMounted, computed, onUnmounted,
} from 'vue';
import Message from '@/shared/message/message';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppMemberMergeSuggestionsDetails from '@/modules/member/components/suggestions/member-merge-suggestions-details.vue';
import { merge } from 'lodash';
import useMemberMergeMessage from '@/shared/modules/merge/config/useMemberMergeMessage';
import LfButton from '@/ui-kit/button/Button.vue';
import AppMemberMergeSimilarity from '@/modules/member/components/suggestions/member-merge-similarity.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import { MemberService } from '../member-service';

const props = defineProps({
  query: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  offset: {
    type: Number,
    required: false,
    default: 0,
  },
});

const emit = defineEmits(['reload']);

const { trackEvent } = useProductTracking();
const { getContributorMergeActions } = useContributorStore();

const membersToMerge = ref([]);
const primary = ref(0);
const offset = ref(props.offset);
const count = ref(0);
const loading = ref(false);

const sendingIgnore = ref(false);
const sendingMerge = ref(false);

const changed = ref(false);

const bioHeight = ref(0);

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
  mergedMembers.identities = [
    ...primaryMember.identities,
    ...secondaryMember.identities,
  ];
  mergedMembers.score = Math.max(primaryMember.score, secondaryMember.score);
  return mergedMembers;
});

const fetch = (page) => {
  if (page > -1) {
    offset.value = page;
  }

  trackEvent({
    key: FeatureEventKey.NAVIGATE_MEMBERS_MERGE_SUGGESTIONS,
    type: EventType.FEATURE,
  });

  loading.value = true;

  MemberService.fetchMergeSuggestions(1, offset.value, props.query ?? {})
    .then((res) => {
      offset.value = +res.offset;
      count.value = res.count;
      [membersToMerge.value] = res.rows;

      primary.value = 0;
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

  trackEvent({
    key: FeatureEventKey.IGNORE_MEMBER_MERGE_SUGGESTION,
    type: EventType.FEATURE,
    properties: {
      similarity: membersToMerge.value.similarity,
    },
  });

  sendingIgnore.value = true;
  MemberService.addToNoMerge(...membersToMerge.value.members)
    .then(() => {
      Message.success('Merging suggestion ignored successfully');
      getContributorMergeActions();
      const nextIndex = offset.value >= (count.value - 1) ? Math.max(count.value - 2, 0) : offset.value;
      fetch(nextIndex);
      changed.value = true;
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

  const primaryMember = membersToMerge.value.members[primary.value];
  const secondaryMember = membersToMerge.value.members[(primary.value + 1) % 2];

  const { loadingMessage, apiErrorMessage } = useMemberMergeMessage;

  loadingMessage();

  trackEvent({
    key: FeatureEventKey.MERGE_MEMBER_MERGE_SUGGESTION,
    type: EventType.FEATURE,
    properties: {
      similarity: membersToMerge.value.similarity,
    },
  });

  MemberService.merge(primaryMember, secondaryMember)
    .then(() => {
      Message.closeAll();
      Message.info(
        "We're finalizing profiles merging. We will let you know once the process is completed.",
        {
          title: 'Profiles merging in progress',
        },
      );
      primary.value = 0;

      const nextIndex = offset.value >= (count.value - 1) ? Math.max(count.value - 2, 0) : offset.value;
      fetch(nextIndex);
      changed.value = true;
    })
    .catch((error) => {
      const shouldLoadNextSuggestion = apiErrorMessage({ error });

      if (shouldLoadNextSuggestion) {
        fetch();
      }
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

onMounted(async () => {
  fetch(props.offset);
});

onUnmounted(() => {
  if (changed.value) {
    emit('reload');
  }
});
</script>

<script>
export default {
  name: 'AppMemberMergeSuggestionsPage',
};
</script>
