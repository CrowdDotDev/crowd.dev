<template>
  <!-- loading state -->
  <article
    v-if="loading || !member"
    class="flex items-center"
  >
    <app-loading height="32px" width="32px" radius="2rem" />
    <div class="flex-grow pl-3">
      <app-loading
        height="12px"
        width="120px"
      ></app-loading>
    </div>
  </article>
  <router-link
    v-else
    class="flex items-center group"
    :to="{ name: 'memberView', params: { id: member.id } }"
  >
    <app-avatar :entity="member" size="xs" />
    <div class="flex-grow pl-3">
      <app-member-display-name
        :member="member"
        class="flex items-center"
        custom-class="text-xs leading-5 font-medium text-gray-900 group-hover:text-brand-500 transition mr-2"
      />
      <p class="text-2xs leading-4 !text-gray-500">
        <slot />
      </p>
    </div>
  </router-link>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppMemberDisplayName from '@/modules/member/components/member-display-name'

export default {
  name: 'AppDashboardMemberItem',
  components: {
    AppMemberDisplayName,
    AppLoading,
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
