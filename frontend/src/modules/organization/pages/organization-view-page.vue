<template>
  <app-page-wrapper>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <router-link
        class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
        :to="{ path: '/organizations' }"
      >
        <i class="ri-arrow-left-s-line mr-2"></i
        >Organizations</router-link
      >
      <div class="grid grid-cols-3 gap-6 mt-4">
        <app-organization-view-header
          :organization="organization"
          class="col-span-2"
        />
        <app-organization-view-aside
          :organization="organization"
        />
        <div class="panel w-full col-span-2">
          <el-tabs v-model="tab">
            <el-tab-pane
              label="Associated members"
              name="members"
            >
              <app-organization-view-members
                :organization-id="organization.id"
              />
            </el-tab-pane>
            <el-tab-pane
              label="Activities"
              name="activities"
            >
              <app-activity-timeline
                :entity-id="organization.id"
                entity-type="organization"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </app-page-wrapper>
</template>

<script>
export default {
  name: 'AppOrganizationViewPage'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { defineProps, computed, onMounted, ref } from 'vue'

import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppActivityTimeline from '@/modules/activity/components/activity-timeline'
import AppOrganizationViewHeader from '@/modules/organization/components/view/organization-view-header'
import AppOrganizationViewAside from '@/modules/organization/components/view/organization-view-aside'
import AppOrganizationViewMembers from '@/modules/organization/components/view/organization-view-members'

const store = useStore()
const props = defineProps({
  id: {
    type: String,
    default: null
  }
})

const organization = computed(() => {
  return store.getters['organization/find'](props.id) || {}
})

const loading = ref(true)
const tab = ref('members')

onMounted(async () => {
  await store.dispatch('organization/doFind', props.id)
  loading.value = false
})
</script>
