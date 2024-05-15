<template>
  <div>
    <cr-table type="bordered">
      <thead>
        <tr>
          <cr-table-head>
            ORGANIZATION
          </cr-table-head>
          <cr-table-head>
            ASSOCIATED PROJECT GROUPS
          </cr-table-head>
          <cr-table-head>
            IDENTITIES
          </cr-table-head>
          <cr-table-head />
        </tr>
      </thead>

      <tbody>
        <tr v-for="org of props.organizations" :key="org.id">
          <td>
            <app-organization-name
              class="w-full"
              :organization="org"
            />
          </td>
          <td>
            <div class="flex">
              <div class="border border-gray-300 h-6 px-2 rounded-md bg-white text-sm whitespace-nowrap">
                {{ org.segments.length }} project group
              </div>
            </div>
          </td>
          <td>
            <div class="h-full flex items-center">
              <app-identities-horizontal-list-organizations
                :organization="org"
                :limit="5"
              />
            </div>
          </td>
          <td>
            <div class="flex justify-end">
              <cr-dropdown placement="bottom-end">
                <template #trigger>
                  <cr-button type="tertiary-gray" :icon-only="true" size="small">
                    <i class="ri-more-fill !text-lg" />
                  </cr-button>
                </template>
                <cr-dropdown-item>
                  <i class="ri-link-m" />
                  Merge organization
                </cr-dropdown-item>
                <cr-dropdown-item>
                  <i class="ri-team-line" />
                  Mark as team organization
                </cr-dropdown-item>
                <cr-dropdown-separator />
                <cr-dropdown-item type="danger">
                  <i class="ri-delete-bin-6-line" />
                  Delete organization
                </cr-dropdown-item>
              </cr-dropdown>
            </div>
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <td colspan="4">
            <slot name="pagination" />
          </td>
        </tr>
      </tfoot>
    </cr-table>
  </div>
</template>

<script setup lang="ts">
import CrTable from '@/ui-kit/table/Table.vue';
import CrTableHead from '@/ui-kit/table/TableHead.vue';
import AppOrganizationName from '@/modules/organization/components/organization-name.vue';
import AppIdentitiesHorizontalListOrganizations
  from '@/shared/modules/identities/components/identities-horizontal-list-organizations.vue';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrButton from '@/ui-kit/button/Button.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import CrDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';

const props = defineProps<{
      organizations: any[]
    }>();
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationListTable',
};
</script>
