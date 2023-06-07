<template>
  <app-page-wrapper>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <div v-else>
      <router-link
        class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
        :to="{ path: '/members' }"
      >
        <i class="ri-arrow-left-s-line mr-2" />Members
      </router-link>
      <div class="grid grid-cols-3 gap-6 mt-4">
        <app-member-view-header
          :member="member"
          class="col-span-2"
        />
        <div class="row-span-4">
          <app-member-view-aside :member="member" />
        </div>
        <app-member-view-contributions
          v-if="member.contributions"
          :contributions="member.contributions"
          class="col-span-2"
        />
        <div class="panel w-full col-span-2">
          <el-tabs v-model="tab">
            <el-tab-pane
              label="Activities"
              name="activities"
            >
              <app-activity-timeline
                :entity-id="member.id"
                entity-type="member"
              />
            </el-tab-pane>
            <el-tab-pane
              v-if="hasPermissionToTask || isTaskLocked"
              :label="`Tasks (${
                (tasksTab && tasksTab.openTaskCount) || 0
              })`"
              name="tasks"
            >
              <app-member-view-tasks
                ref="tasksTab"
                :member="member"
              />
            </el-tab-pane>
            <el-tab-pane label="Notes" name="notes">
              <app-member-view-notes :member="member" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  defineProps,
  computed,
  onMounted,
  ref,
  defineExpose,
} from 'vue';

import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { TaskPermissions } from '@/modules/task/task-permissions';
import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';
import AppMemberViewHeader from '@/modules/member/components/view/member-view-header.vue';
import AppMemberViewAside from '@/modules/member/components/view/member-view-aside.vue';
import AppMemberViewNotes from '@/modules/member/components/view/member-view-notes.vue';
import AppMemberViewContributions from '@/modules/member/components/view/member-view-contributions.vue';
import AppMemberViewTasks from '@/modules/member/components/view/member-view-tasks.vue';
import { useMemberStore } from '@/modules/member/store/pinia';

const store = useStore();
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
});

const { currentTenant, currentUser } = mapGetters('auth');
const { getMemberCustomAttributes } = useMemberStore();

const member = computed(() => store.getters['member/find'](props.id) || {});

const isTaskLocked = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);
const hasPermissionToTask = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const tasksTab = ref(null);

const loading = ref(true);
const tab = ref('activities');

onMounted(async () => {
  await store.dispatch('member/doFind', props.id);
  if (
    Object.keys(store.state.member.customAttributes)
      .length === 0
  ) {
    await getMemberCustomAttributes();
  }
  loading.value = false;
});

defineExpose({
  tasksTab,
});
</script>

<script>
export default {
  name: 'AppMemberViewPage',
};
</script>
