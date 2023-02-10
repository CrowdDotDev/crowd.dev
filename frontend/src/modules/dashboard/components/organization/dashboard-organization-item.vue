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
    <div
      class="flex items-center group hover:cursor-pointer"
      @click="onOrganizationClick"
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
    </div>
  </article>
  <app-paywall-modal
    v-model="isUpgradeModalOpen"
    module="organizations"
  />
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar.vue'
import AppLoading from '@/shared/loading/loading-placeholder.vue'
import AppPaywallModal from '@/modules/layout/components/paywall-modal.vue'

export default {
  name: 'AppDashboardOrganizationItem',
  components: { AppLoading, AppAvatar, AppPaywallModal },
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
  data() {
    return {
      isUpgradeModalOpen: false
    }
  },
  computed: {
    entity() {
      return {
        avatar: this.organization.logo,
        displayName: this.organization.name.replace('@', '')
      }
    }
  },
  methods: {
    async onOrganizationClick() {
      this.$router.push({
        name: 'organizationView',
        params: { id: this.organization.id }
      })
    }
  }
}
</script>
