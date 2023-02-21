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
      :to="{
        name: 'organizationView',
        params: { id: props.organization.id }
      }"
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
    </router-link>
  </article>
</template>

<script>
export default {
  name: 'AppDashboardOrganizationItem'
}
</script>

<script setup>
import AppAvatar from '@/shared/avatar/avatar.vue'
import AppLoading from '@/shared/loading/loading-placeholder.vue'
import { defineProps, computed } from 'vue'

const props = defineProps({
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
})

const entity = computed(() => {
  return {
    avatar: props.organization.logo,
    displayName: props.organization.name.replace('@', '')
  }
})
</script>
