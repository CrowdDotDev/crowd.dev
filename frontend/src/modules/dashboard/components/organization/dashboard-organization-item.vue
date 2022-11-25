<template>
  <article
    v-if="loading || !organization"
    class="flex items-center"
  >
    <app-loading height="32px" width="32px" radius="50%" />
    <div class="flex-grow pl-3">
      <app-loading
        height="12px"
        width="120px"
      ></app-loading>
    </div>
  </article>
  <article v-else class="flex">
    <router-link
      class="flex items-center group"
      :to="{
        name: 'organizationView',
        params: { id: organization.id }
      }"
    >
      <app-avatar :entity="entity" size="xxs" />
      <div class="flex-grow pl-3">
        <h6
          class="text-xs leading-5 font-medium text-gray-900 hover:text-brand-500 transition"
        >
          {{ organization.name }}
        </h6>
        <p class="text-2xs leading-4 !text-gray-500">
          {{ organization.memberCount }} member{{
            organization.memberCount > 1 ? 's' : ''
          }}
        </p>
      </div>
    </router-link>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardOrganizationItem',
  components: { AppLoading, AppAvatar },
  props: {
    organization: {
      type: Object,
      required: false,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
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
