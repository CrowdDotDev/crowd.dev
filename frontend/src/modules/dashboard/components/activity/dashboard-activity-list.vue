<template>
  <div class="pt-3 px-6">
    <div v-if="activities.loading">
      <app-dashboard-activity-item
        v-for="el of new Array(4)"
        :key="el"
        :loading="true"
      />
    </div>
    <div v-else>
      <app-dashboard-activity-item
        v-for="(activity, ai) of recentActivities"
        :key="activity.id"
        :class="{
          'border-b': ai < recentActivities.length - 1,
        }"
        :activity="activity"
      />

      <app-dashboard-empty-state
        v-if="recentActivities.length === 0"
        icon-class="ri-list-check-2"
        class="pt-17 pb-17"
      >
        No activities during this period
      </app-dashboard-empty-state>
    </div>
    <div class="pt-3 pb-2 flex justify-center">
      <router-link
        :to="{
          name: 'activity',
          hash: '#activity',
        }"
        class="text-red font-medium text-center text-xs leading-5"
      >
        All activities
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardActivityItem from '@/modules/dashboard/components/activity/dashboard-activity-item.vue';

export default {
  name: 'AppDashboardActivityList',
  components: {
    AppDashboardEmptyState,
    AppDashboardActivityItem,
  },
  emits: { count: null },
  data() {
    return {
      storeUnsubscribe: () => {},
    };
  },
  computed: {
    ...mapGetters('dashboard', [
      'recentActivities',
      'activities',
    ]),
  },
  created() {
    this.storeUnsubscribe = this.$store.subscribe(
      (mutation) => {
        if (mutation.type === 'activity/DESTROY_SUCCESS') {
          this.$store.dispatch(
            'dashboard/getRecentActivities',
          );
        }
      },
    );
  },
  beforeUnmount() {
    this.storeUnsubscribe();
  },
};
</script>
