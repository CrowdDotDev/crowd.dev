<template>
  <!-- loading state -->
  <article
    v-if="loading || !member"
    class="flex items-center mb-4"
  >
    <app-loading height="32px" width="32px" radius="2rem" />
    <div class="flex-grow pl-3">
      <app-loading height="13px" class="mb-1"></app-loading>
      <app-loading height="12px"></app-loading>
    </div>
  </article>
  <article v-else class="flex items-center">
    <app-avatar :entity="member" size="xs" />
    <div class="flex-grow pl-3">
      <h6 class="text-xs leading-5 font-medium">
        {{ member.displayName }}
      </h6>
      <p class="text-2xs leading-4 !text-gray-500">
        <app-activity-message
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
import AppActivityMessage from '@/modules/activity/components/activity-message'
import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardMembersItem',
  components: {
    AppLoading,
    AppActivityMessage,
    AppAvatar
  },
  props: {
    member: {
      type: Object,
      required: false,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    }
  }
}
</script>
