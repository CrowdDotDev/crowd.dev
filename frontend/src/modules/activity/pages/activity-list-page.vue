<template>
  <app-page-wrapper size="narrow">
    <div class="activity-list-page">
      <app-lf-page-header text-class="text-sm text-primary-600 mb-2.5" />
      <div class="flex justify-between">
        <div>
          <h4>Activities</h4>
          <div class="text-xs text-gray-500 mb-10">
            Activities are all interactions with your company brand, community, and product
          </div>
        </div>
        <div class="flex h-fit">
          <lf-button
            type="primary-link"
            size="medium"
            class="text-gray-600 mr-4"
            @click="onActivityTypesClick"
          >
            <lf-icon name="gear" :size="20" />
            Activity types
          </lf-button>
          <lf-button
            v-if="hasPermission(LfPermission.activityCreate)"
            type="primary"
            size="medium"
            class="text-gray-600"
            @click="onAddActivity"
          >
            Add activity
          </lf-button>
        </div>
      </div>

      <div class="relative">
        <el-tabs :model-value="activeView" class="mb-6" @update:model-value="changeView">
          <el-tab-pane
            label="Activities"
            name="activity"
          />
          <el-tab-pane
            label="Conversations"
            name="conversation"
          />
        </el-tabs>
      </div>
      <app-activity-list
        v-if="activeView === 'activity'"
        @edit="edit($event)"
      />
      <app-conversation-list
        v-else-if="activeView === 'conversation'"
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
    :subproject-id="subprojectId"
  />

  <app-lf-sub-projects-list-modal
    v-if="isSubProjectSelectionOpen"
    v-model="isSubProjectSelectionOpen"
    :title="subProjectsModalTitle"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppActivityTypeListDrawer from '@/modules/activity/components/type/activity-type-list-drawer.vue';
import AppActivityFormDrawer from '@/modules/activity/components/activity-form-drawer.vue';
import AppActivityTypeFormModal from '@/modules/activity/components/type/activity-type-form-modal.vue';
import AppActivityList from '@/modules/activity/components/activity-list.vue';
import AppConversationList from '@/modules/conversation/components/conversation-list.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import AppLfSubProjectsListModal from '@/modules/admin/modules/projects/components/lf-sub-projects-list-modal.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const route = useRoute();
const router = useRouter();

const isActivityTypeDrawerOpen = ref(false);
const isActivityDrawerOpen = ref(false);
const isActivityTypeFormVisible = ref(false);
const editableActivity = ref(null);
const isSubProjectSelectionOpen = ref(false);
const subProjectsModalTitle = ref('');
const subprojectId = ref<string | undefined>();
const drawer = ref<string | undefined>();

const activeView = ref('activity');

const { hasPermission } = usePermissions();

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
  subProjectsModalTitle.value = 'Add activity';
};

const onActivityTypesClick = () => {
  drawer.value = 'activity-types';
  isSubProjectSelectionOpen.value = true;
  subProjectsModalTitle.value = 'Activity types';
};

const onSubProjectSelection = (id: string) => {
  subprojectId.value = id;
  isSubProjectSelectionOpen.value = false;

  if (drawer.value === 'add-activity') {
    isActivityDrawerOpen.value = true;
  } else if (drawer.value === 'activity-types') {
    isActivityTypeDrawerOpen.value = true;
  }
};

const changeView = (view: string) => {
  router.push({
    hash: `#${view}`,
    query: {},
  });
};

watch(() => route.hash, (hash: string) => {
  const view = hash.substring(1);
  if (view.length > 0 && view !== activeView.value) {
    activeView.value = view;
  }
}, { immediate: true });
</script>
