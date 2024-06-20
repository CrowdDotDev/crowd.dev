<template>
  <div>
    <el-button-group class="ml-4">
      <!-- Edit contact -->
      <el-button class="btn btn--bordered btn--sm !h-8" :disabled="isEditLockedForSampleData" @click="edit()">
        <span class="ri-pencil-line text-base mr-2" />Edit contact
      </el-button>
      <el-button
        v-if="mergeSuggestionsCount > 0"
        class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5"
        :disabled="isEditLockedForSampleData"
        @click="mergeSuggestions()"
      >
        <span class="mr-2 h-5 px-1.5 rounded-md bg-brand-100 text-brand-500 leading-5">{{ mergeSuggestionsCount }}</span>Merge suggestion
      </el-button>

      <el-button
        v-else
        class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5"
        :disabled="isEditLockedForSampleData"
        @click="merge()"
      >
        <span class="ri-shuffle-line text-base mr-2" />Merge
      </el-button>
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
  />
  <app-member-merge-suggestions-dialog
    v-if="isMergeSuggestionsDialogOpen"
    v-model="isMergeSuggestionsDialogOpen"
    :query="{
      memberId: props.member?.id,
    }"
  />
</template>

<script setup>
import AppMemberDropdown from '@/modules/member/components/member-dropdown.vue';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useRouter } from 'vue-router';
import AppMemberFindGithubDrawer from '@/modules/member/components/member-find-github-drawer.vue';
import AppMemberMergeDialog from '@/modules/member/components/member-merge-dialog.vue';
import { MemberService } from '@/modules/member/member-service';
import AppMemberMergeSuggestionsDialog from '@/modules/member/components/member-merge-suggestions-dialog.vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['unmerge']);

const router = useRouter();

const { currentUser, currentTenant } = mapGetters('auth');

const isMergeDialogOpen = ref(null);
const isMergeSuggestionsDialogOpen = ref(false);
const isFindGithubDrawerOpen = ref(null);
const mergeSuggestionsCount = ref(0);

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

const fetchMembersToMergeCount = () => {
  MemberService.fetchMergeSuggestions(1, 0, {
    memberId: props.member.id,
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
