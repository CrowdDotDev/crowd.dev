<template>
  <div class="member-view-header panel relative">
    <div class="flex items-start justify-between">
      <div class="flex items-start">
        <app-avatar
          :entity="{
            avatar: organization.logo,
            displayName: organization.name.replace('@', '')
          }"
          size="xl"
          class="mr-4"
        />
        <div class="flex items-center">
          <h5>{{ organization.name }}</h5>
        </div>
      </div>
      <div class="flex items-center">
        <app-organization-dropdown
          :organization="organization"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewHeader'
}
</script>

<script setup>
import { defineProps } from 'vue'
import AppOrganizationDropdown from '@/modules/organization/components/organization-dropdown'

defineProps({
  organization: {
    type: Object,
    default: () => {}
  }
})
</script>

<style lang="scss">
.member-view-header.panel {
  @apply pb-24;
}
</style>
