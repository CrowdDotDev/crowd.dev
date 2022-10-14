<template>
  <app-page-wrapper>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <router-link
        class="text-gray-600 btn-link--md btn-link--secondary p-0 flex items-center"
        :to="{ path: '/members' }"
      >
        <i class="ri-arrow-left-s-line mr-2"></i
        >Members</router-link
      >
      <div class="grid grid-cols-3 gap-6 mt-4">
        <app-member-view-header
          :member="member"
          class="col-span-2"
        />
        <app-member-view-aside :member="member" />
        <app-member-view-activities
          :member-id="member.id"
          class="col-span-2"
        />
      </div>
    </div>
    <app-member-manage-identities-drawer
      v-model="identitiesDrawer"
      :member="member"
    />
  </app-page-wrapper>
</template>

<script>
export default {
  name: 'AppMemberViewPage'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { defineProps, computed, onMounted, ref } from 'vue'

import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppMemberManageIdentitiesDrawer from '../components/member-manage-identities-drawer'
import AppMemberViewHeader from '@/modules/member/components/view/member-view-header'
import AppMemberViewAside from '@/modules/member/components/view/member-view-aside'
import AppMemberViewActivities from '@/modules/member/components/view/member-view-activities'

const store = useStore()
const props = defineProps({
  id: {
    type: String,
    default: null
  }
})

const member = computed(() => {
  return store.getters['member/find'](props.id) || {}
})

const loading = ref(true)
const identitiesDrawer = ref(false)

onMounted(async () => {
  await store.dispatch('member/doFind', props.id)
  if (
    Object.keys(store.state.member.customAttributes)
      .length === 0
  ) {
    await store.dispatch('member/doFetchCustomAttributes')
  }
  loading.value = false
})
</script>
