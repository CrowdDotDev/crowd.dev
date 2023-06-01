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

<script>
import { mapState, mapGetters } from 'vuex';
import { ActivityPermissions } from '@/modules/activity/activity-permissions';
import AppActivityListFilter from '@/modules/activity/components/list/activity-list-filter.vue';
import AppActivityTypeListDrawer from '@/modules/activity/components/type/activity-type-list-drawer.vue';
import AppActivityFormDrawer from '@/modules/activity/components/activity-form-drawer.vue';
import AppActivityTypeFormModal from '@/modules/activity/components/type/activity-type-form-modal.vue';
import AppActivityList from '@/modules/activity/components/activity-list.vue';
import AppConversationList from '@/modules/conversation/components/conversation-list.vue';
import AppActivityListTabs from '@/modules/activity/components/activity-list-tabs.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';

export default {
  name: 'AppActivityListPage',

  components: {
    AppActivityTypeFormModal,
    AppActivityFormDrawer,
    AppActivityTypeListDrawer,
    AppActivityList,
    AppConversationList,
    AppActivityListTabs,
    AppActivityListFilter,
    AppLfPageHeader,
  },

  data() {
    return {
      creating: false,
      isActivityTypeDrawerOpen: false,
      isActivityDrawerOpen: false,
      isActivityTypeFormVisible: false,
      editableActivity: null,
    };
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
      activeView: 'activity/activeView',
      recordsArray: 'activity/rows',
    }),
    ...mapState({
      loading: (state) => state.activity.list.loading,
    }),
    hasPermissionToCreate() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser,
      ).create;
    },
  },

  async mounted() {
    window.analytics.page('Activities');
  },
  methods: {
    edit(activity) {
      this.isActivityDrawerOpen = true;
      this.editableActivity = activity;
    },
  },
};
</script>

<style></style>
