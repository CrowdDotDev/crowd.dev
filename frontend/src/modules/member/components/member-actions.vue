<template>
  <div>
    <el-button-group class="ml-4">
      <!-- Edit contributor -->
      <el-button class="btn btn--bordered btn--sm !h-8" :disabled="isEditLockedForSampleData" @click="edit()">
        <span class="ri-pencil-line text-base mr-2" />Edit contributor
      </el-button>
      <el-tooltip
        v-if="mergeSuggestionsCount > 0"
        content="Coming soon"
        placement="top"
        :disabled="hasPermissionsToMerge"
      >
        <span>
          <el-button
            class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5 !bg-brand-25 !rounded-l-none !rounded-r-none"
            :disabled="isEditLockedForSampleData || !hasPermissionsToMerge"
            @click="mergeSuggestions()"
          >
            <span class="mr-2 h-5 px-1.5 rounded-md bg-brand-100 text-brand-500 leading-5">{{ mergeSuggestionsCount }}</span>Merge suggestion
          </el-button>
        </span>
      </el-tooltip>

      <el-tooltip
        v-else
        content="Coming soon"
        placement="top"
        :disabled="hasPermissionsToMerge"
      >
        <span>
          <el-button
            class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5 !rounded-l-none !rounded-r-none"
            :disabled="isEditLockedForSampleData || !hasPermissionsToMerge"
            @click="merge()"
          >
            <span class="ri-shuffle-line text-base mr-2" />Merge
          </el-button>
        </span>
      </el-tooltip>

      <app-member-dropdown
        :member="props.member"
        :hide-merge="true"
        :hide-edit="true"
        @unmerge="emit('unmerge')"
        @find-github="isFindGithubDrawerOpen = member"
      >
        <template #trigger>
          <el-button class="btn btn--bordered btn--sm !p-2 !h-8 !border-l-2 !border-l-gray-200">
            <span class="ri-more-fill text-base" />
          </el-button>
        </template>
      </app-member-dropdown>
    </el-button-group>
  </div>
  <app-member-find-github-drawer
    v-if="isFindGithubDrawerOpen"
    v-model="isFindGithubDrawerOpen"
  />
  <app-member-merge-dialog
    v-if="isMergeDialogOpen"
    v-model="isMergeDialogOpen"
    :to-merge="memberToMerge"
  />
  <app-member-merge-suggestions-dialog
    v-if="isMergeSuggestionsDialogOpen"
    v-model="isMergeSuggestionsDialogOpen"
    :query="{
      filter: {
        memberId: props.member?.id,
      },
    }"
  />
</template>

<script setup>
import AppMemberDropdown from '@/modules/member/components/member-dropdown.vue';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { useRouter } from 'vue-router';
import AppMemberFindGithubDrawer from '@/modules/member/components/member-find-github-drawer.vue';
import AppMemberMergeDialog from '@/modules/member/components/member-merge-dialog.vue';
import { MemberService } from '@/modules/member/member-service';
import AppMemberMergeSuggestionsDialog from '@/modules/member/components/member-merge-suggestions-dialog.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { useMemberStore } from '@/modules/member/store/pinia';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['unmerge']);

const router = useRouter();

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const memberStore = useMemberStore();
const { toMergeMember } = storeToRefs(memberStore);

const isMergeDialogOpen = ref(null);
const isMergeSuggestionsDialogOpen = ref(false);
const isFindGithubDrawerOpen = ref(null);
const mergeSuggestionsCount = ref(0);
const memberToMerge = ref(null);

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(tenant.value, user.value)
    .editLockedForSampleData,
);

const hasPermissionsToMerge = computed(() => new MemberPermissions(
  tenant.value,
  user.value,
)?.mergeMembers);

watch(toMergeMember, (updatedValue) => {
  if (updatedValue) {
    MemberService.find(updatedValue.id, [updatedValue.segmentId]).then((response) => {
      isMergeDialogOpen.value = props.member;
      memberToMerge.value = response;

      memberStore.removeToMergeMember();
    });
  }
}, {
  deep: true,
});

const fetchMembersToMergeCount = () => {
  MemberService.fetchMergeSuggestions(1, 0, {
    filter: {
      memberId: props.member.id,
    },
    detail: false,
    countOnly: true,
  })
    .then(({ count }) => {
      mergeSuggestionsCount.value = count;
    });
};

const edit = () => {
  if (isEditLockedForSampleData.value) {
    return;
  }
  router.push({
    name: 'memberEdit',
    params: {
      id: props.member.id,
    },
  });
};
const mergeSuggestions = () => {
  if (isEditLockedForSampleData.value) {
    return;
  }
  isMergeSuggestionsDialogOpen.value = true;
};

const merge = () => {
  if (isEditLockedForSampleData.value) {
    return;
  }
  isMergeDialogOpen.value = props.member;
};

watch(() => props.member, () => {
  fetchMembersToMergeCount();
});

onMounted(() => {
  fetchMembersToMergeCount();
});
</script>

<script>
export default {
  name: 'AppMemberActions',
};
</script>

<style lang="scss">
</style>
