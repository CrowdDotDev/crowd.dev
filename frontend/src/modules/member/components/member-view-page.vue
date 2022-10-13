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
      <div class="member-view-page mt-4">
        <div class="col-span-2">
          <div class="panel">
            <div class="flex items-start justify-between">
              <div class="flex items-start">
                <app-avatar
                  :entity="member"
                  size="xl"
                  class="mr-4"
                />
                <div>
                  <h5>{{ member.displayName }}</h5>
                  <div class="flex items-center">
                    <span
                      v-if="
                        member.attributes?.jobTitle
                          ?.default || false
                      "
                      class="text-gray-600 text-2xs"
                      >{{
                        member.attributes.jobTitle.default
                      }}</span
                    >
                    <span class="ml-2">
                      <img
                        v-if="
                          member.organizations?.length >
                            0 || false
                        "
                        :src="member.organizations[0].logo"
                        alt=""
                      />
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center">
                <app-member-sentiment
                  :member="member"
                  class="mr-4"
                />
                <app-member-engagement-level
                  :member="member"
                  class="mr-4"
                />
                <app-member-dropdown
                  :member="member"
                  :show-view-member="false"
                />
              </div>
            </div>
            <div class="text-sm text-gray-600 mt-6 mb-10">
              {{ member.attributes.bio.default }}
            </div>

            <div
              class="flex items-center py-3 border-b border-gray-200"
            >
              <div class="w-40 text-sm text-gray-500">
                Tags
              </div>
              <div class="text-sm">
                <app-tags :member="member" />
              </div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="flex items-center justify-between">
            <div class="font-medium text-black">
              Identities
            </div>
            <el-button
              class="btn btn-link btn-link--primary"
              @click="identitiesDrawer = true"
              >Manage Identities</el-button
            >
          </div>
        </div>
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
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppMemberEngagementLevel from './member-engagement-level'
import AppMemberDropdown from './member-dropdown'
import AppMemberManageIdentitiesDrawer from './member-manage-identities-drawer'

import { useStore } from 'vuex'
import { defineProps, computed, onMounted, ref } from 'vue'
import AppTags from '@/modules/tag/components/tag-list'
import AppMemberSentiment from '@/modules/member/components/member-sentiment'

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
  loading.value = false
})
</script>

<style lang="scss">
.member-view-page {
  @apply grid grid-cols-3 gap-6;
}
</style>
