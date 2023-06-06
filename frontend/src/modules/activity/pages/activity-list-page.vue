<template>
  <app-page-wrapper size="narrow">
    <div class="activity-list-page">
      <app-lf-page-header text-class="text-sm text-brand-500 mb-2.5" />
      <div class="flex justify-between">
        <div>
          <h4>
            Activities
          </h4>
          <div class="text-xs text-gray-500 mb-10">
            Activities are everything that is happening in
            your community
          </div>
        </div>
        <div class="flex">
          <el-button
            class="btn btn--transparent btn--md text-gray-600 mr-4"
            @click="onActivityTypesClick"
          >
            <i class="ri-settings-3-line text-lg mr-2" />
            Activity types
          </el-button>
          <el-button
            class="btn btn--primary btn--md text-gray-600"
            @click="onAddActivity"
          >
            Add activity
          </el-button>
        </div>
      </div>

      <app-activity-list-tabs />
      <app-activity-list-filter
        :module="activeView.type"
      />
      <app-activity-list
        v-if="activeView.type === 'activities'"
        :activities="recordsArray"
        :loading="loading"
        :items-as-cards="true"
        @edit="edit($event)"
      />
      <app-conversation-list
        v-else-if="activeView.type === 'conversations'"
        :conversations="recordsArray"
        :loading="loading"
        :items-as-cards="true"
      />
    </div>
  </app-page-wrapper>
  <app-activity-type-list-drawer
    v-if="isActivityTypeDrawerOpen"
    v-model="isActivityTypeDrawerOpen"
    :subproject-id="subprojectId"
  />
  <app-activity-form-drawer
    v-if="isActivityDrawerOpen"
    v-model="isActivityDrawerOpen"
    :subproject-id="subprojectId"
    :activity="editableActivity"
    @add-activity-type="isActivityTypeFormVisible = true"
    @update:model-value="editableActivity = null"
  />
  <app-activity-type-form-modal
    v-if="isActivityTypeFormVisible"
    v-model="isActivityTypeFormVisible"
  />

  <app-lf-sub-projects-list-modal
    v-if="isSubProjectSelectionOpen"
    v-model="isSubProjectSelectionOpen"
    title="Add member"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup>
import { useStore } from 'vuex';
import AppActivityListFilter from '@/modules/activity/components/list/activity-list-filter.vue';
import AppActivityTypeListDrawer from '@/modules/activity/components/type/activity-type-list-drawer.vue';
import AppActivityFormDrawer from '@/modules/activity/components/activity-form-drawer.vue';
import AppActivityTypeFormModal from '@/modules/activity/components/type/activity-type-form-modal.vue';
import AppActivityList from '@/modules/activity/components/activity-list.vue';
import AppConversationList from '@/modules/conversation/components/conversation-list.vue';
import AppActivityListTabs from '@/modules/activity/components/activity-list-tabs.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppLfSubProjectsListModal from '@/modules/lf/segments/components/lf-sub-projects-list-modal.vue';
import { computed, onMounted, ref } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const isActivityTypeDrawerOpen = ref(false);
const isActivityDrawerOpen = ref(false);
const isActivityTypeFormVisible = ref(false);
const editableActivity = ref(null);
const isSubProjectSelectionOpen = ref(false);
const subprojectId = ref(null);
const drawer = ref(null);

const store = useStore();

const { activeView, rows: recordsArray } = mapGetters('activity');
const loading = computed(() => store.state.activity.list.loading);

onMounted(() => {
  window.analytics.page('Activities');
});

const edit = (activity) => {
  isActivityDrawerOpen.value = true;
  editableActivity.value = activity;
};

const onAddActivity = () => {
  drawer.value = 'add-activity';
  isSubProjectSelectionOpen.value = true;
};

const onActivityTypesClick = () => {
  drawer.value = 'activity-types';
  isSubProjectSelectionOpen.value = true;
};

const onSubProjectSelection = (id) => {
  subprojectId.value = id;
  isSubProjectSelectionOpen.value = false;

  if (drawer.value === 'add-activity') {
    isActivityDrawerOpen.value = true;
  } else if (drawer.value === 'activity-types') {
    isActivityTypeDrawerOpen.value = true;
  }
};
</script>

<script>
export default {
  name: 'AppActivityListPage',
};
</script>
