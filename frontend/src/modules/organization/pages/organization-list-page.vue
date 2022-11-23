<template>
  <app-page-wrapper>
    <div class="member-list-page">
      <div class="mb-10">
        <div class="flex items-center justify-between">
          <h4>Organizations</h4>
          <div class="flex items-center">
            <router-link
              v-if="hasPermissionToCreate"
              :to="{
                name: 'organizationCreate'
              }"
            >
              <el-button class="btn btn--primary btn--md">
                Add organization
              </el-button>
            </router-link>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all organizations that relate to your
          community
        </div>
      </div>

      <!-- TODO: Uncomment when store is ready -->
      <!-- <app-organization-list-tabs></app-organization-list-tabs> -->
      <!-- <app-organization-list-filter></app-organization-list-filter> -->
      <app-organization-list-table
        :has-organizations="hasOrganizations"
        :is-page-loading="isPageLoading"
      ></app-organization-list-table>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
// import AppOrganizationListTabs from '@/modules/organization/components/list/organization-list-tabs'
// import AppOrganizationListFilter from '@/modules/organization/components/list/organization-list-filter'
import AppOrganizationListTable from '@/modules/organization/components/list/organization-list-table'
import { OrganizationPermissions } from '../organization-permissions'
import { computed, ref, onMounted } from 'vue'
import {
  mapGetters,
  mapState,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { OrganizationService } from '../organization-service'

const { currentUser, currentTenant } = mapGetters('auth')
const { filter } = mapState('organization')
const { doFetch } = mapActions('organization')

const hasPermissionToCreate = computed(
  () =>
    new OrganizationPermissions(
      currentTenant.value,
      currentUser.value
    ).create
)
const hasOrganizations = ref(false)
const isPageLoading = ref(false)

onMounted(async () => {
  isPageLoading.value = true

  await doFetch({
    filter,
    keepPagination: true
  })

  const organizationsList = await doGetOrganizationsCount()

  hasOrganizations.value = !!organizationsList.length
  isPageLoading.value = false
})

const doGetOrganizationsCount = async () => {
  try {
    const response = await OrganizationService.list(
      {},
      '',
      1,
      0
    )

    return response.rows
  } catch (e) {
    return null
  }
}
</script>
