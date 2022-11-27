<template>
  <div class="organization-filter">
    <app-filter-list
      module="organization"
      placeholder="Search organizations..."
      :search-filter="organizationSearch"
    >
      <template #dropdown>
        <app-filter-dropdown
          module="organization"
          :attributes="organizationAttributes"
        />
      </template>
    </app-filter-list>
  </div>
</template>

<script>
export default {
  name: 'AppOrganizationListFilter'
}
</script>

<script setup>
import { OrganizationModel } from '@/modules/organization/organization-model'
import { computed } from 'vue'

const organizationAttributes = Object.values(
  OrganizationModel.fields
).filter((f) => f.filterable)

const organizationSearch = computed(() => {
  return OrganizationModel.fields.search.forFilter()
})
</script>

<style></style>
