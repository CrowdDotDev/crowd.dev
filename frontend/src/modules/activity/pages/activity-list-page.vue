<template>
  <app-page-wrapper size="narrow">
    <div class="activity-list-page">
      <div class="flex justify-between">
        <div>
          <h4>
            Activities
          </h4>
          <div class="text-xs text-gray-500 mb-10">
            Activities are all interactions with your company brand, community, and product
          </div>
        </div>
        <div class="flex">
          <el-button
            class="btn btn--transparent btn--md text-gray-600 mr-4"
            @click="isActivityTypeDrawerOpen = true"
          >
            <i class="ri-settings-3-line text-lg mr-2" />
            Activity types
          </el-button>
          <el-button
            class="btn btn--primary btn--md text-gray-600"
            @click="isActivityDrawerOpen = true"
          >
            Add activity
          </el-button>
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
    v-model="isActivityTypeDrawerOpen"
  />
  <app-activity-form-drawer
    v-model="isActivityDrawerOpen"
    :activity="editableActivity"
    @add-activity-type="isActivityTypeFormVisible = true"
    @update:model-value="editableActivity = null"
  />
  <app-activity-type-form-modal
    v-model="isActivityTypeFormVisible"
  />
</template>

<script setup lang="ts">

import { ref, watch } from 'vue';
import AppActivityTypeListDrawer from '@/modules/activity/components/type/activity-type-list-drawer.vue';
import AppActivityFormDrawer from '@/modules/activity/components/activity-form-drawer.vue';
import AppActivityTypeFormModal from '@/modules/activity/components/type/activity-type-form-modal.vue';
import AppActivityList from '@/modules/activity/components/activity-list.vue';
import AppConversationList from '@/modules/conversation/components/conversation-list.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isActivityTypeDrawerOpen = ref(false);
const isActivityDrawerOpen = ref(false);
const isActivityTypeFormVisible = ref(false);
const editableActivity = ref(null);

const activeView = ref('activity');

const changeView = (view) => {
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

const edit = (activity) => {
  editableActivity.value = activity;
  isActivityDrawerOpen.value = true;
};
</script>

<style></style>
