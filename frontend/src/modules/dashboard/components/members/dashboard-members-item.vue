<template>
  <article class="flex items-center">
    <app-avatar :entity="member" size="xs" />
    <div class="flex-grow pl-3">
      <h6 class="text-xs leading-5 font-medium">
        {{ member.displayName }}
      </h6>
      <p class="text-2xs leading-4 !text-gray-500">
        <app-dashboard-activities-message
          v-if="member.lastActivity"
          :short="true"
          :activity="member.lastActivity"
        />
      </p>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import AppDashboardActivitiesMessage from '@/modules/dashboard/components/activities/dashboard-activities-message'
export default {
  name: 'AppDashboardMembersItem',
  components: { AppDashboardActivitiesMessage, AppAvatar },
  props: {
    member: {
      type: Object,
      required: true
    }
  }
}
</script>
