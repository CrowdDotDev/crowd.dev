<template>
  <article class="flex">
    <app-avatar :entity="entity" size="xxs" />
    <div class="flex-grow pl-3">
      <h6 class="text-xs leading-5 font-medium">
        {{ organization.name }}
      </h6>
      <p class="text-2xs leading-4 !text-gray-500">
        {{ organization.memberCount }} member{{
          organization.memberCount > 1 ? 's' : ''
        }}
      </p>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
export default {
  name: 'AppDashboardOrganizationsItem',
  components: { AppAvatar },
  props: {
    organization: {
      type: Object,
      required: true
    }
  },
  computed: {
    entity() {
      return {
        avatar: this.organization.logo,
        displayName: this.organization.name.replace('@', '')
      }
    }
  }
}
</script>
