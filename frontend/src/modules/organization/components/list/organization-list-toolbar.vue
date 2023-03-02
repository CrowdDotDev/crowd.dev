<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4">
      {{
        pluralize('organization', selectedRows.length, true)
      }}
      selected
    </span>

    <el-dropdown trigger="click" @command="handleCommand">
      <button class="btn btn--bordered btn--sm">
        <span class="mr-2">Actions</span>
        <i class="ri-xl ri-arrow-down-s-line"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item :command="{ action: 'export' }">
          <i class="ri-lg ri-file-download-line mr-1" />
          Export to CSV
        </el-dropdown-item>

        <el-dropdown-item
          :command="{
            action: 'markAsTeamOrganization',
            value: markAsTeamOrganizationOptions.value
          }"
          :disabled="isPermissionReadOnly"
        >
          <i
            class="ri-lg mr-1"
            :class="markAsTeamOrganizationOptions.icon"
          />
          {{ markAsTeamOrganizationOptions.copy }}
        </el-dropdown-item>

        <hr class="border-gray-200 my-1 mx-2" />

        <el-dropdown-item
          :command="{ action: 'destroyAll' }"
          :disabled="isPermissionReadOnly"
        >
          <div class="text-red-500 flex items-center">
            <i class="ri-lg ri-delete-bin-line mr-2" />
            <span>Delete organizations</span>
          </div>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'AppOrganizationListToolbar'
}
</script>

<script setup>
import pluralize from 'pluralize'
import { OrganizationPermissions } from '../../organization-permissions'
import { computed } from 'vue'
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import { OrganizationService } from '../../organization-service'
import Message from '@/shared/message/message'

const { currentUser, currentTenant } = mapGetters('auth')
const { selectedRows, activeView } =
  mapGetters('organization')
const { doExport, doDestroyAll, doFetch } =
  mapActions('organization')

const isPermissionReadOnly = computed(
  () =>
    new OrganizationPermissions(
      currentTenant.value,
      currentUser.value
    ).edit === false
)

const markAsTeamOrganizationOptions = computed(() => {
  const isTeamView = activeView.value.id === 'team'
  const organizationsCopy = pluralize(
    'organization',
    selectedRows.value.length,
    false
  )

  if (isTeamView) {
    return {
      icon: 'ri-bookmark-2-line',
      copy: `Unmark as team ${organizationsCopy}`,
      value: false
    }
  }

  return {
    icon: 'ri-bookmark-line',
    copy: `Mark as team ${organizationsCopy}`,
    value: true
  }
})

const handleDoDestroyAllWithConfirm = async () => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title: 'Delete organizations',
      message:
        "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line'
    })

    await doDestroyAll(
      selectedRows.value.map((item) => item.id)
    )
  } catch (error) {
    console.log(error)
  }
}

const handleDoExport = async () => {
  try {
    await doExport()
  } catch (error) {
    console.log(error)
  }
}

const handleCommand = async (command) => {
  if (command.action === 'export') {
    await handleDoExport()
  } else if (command.action === 'destroyAll') {
    await handleDoDestroyAllWithConfirm()
  } else if (command.action === 'markAsTeamOrganization') {
    Promise.all(
      selectedRows.value.map((row) => {
        return OrganizationService.update(row.id, {
          isTeamOrganization: command.value
        })
      })
    ).then(() => {
      Message.success(
        `${pluralize(
          'Organization',
          selectedRows.length,
          false
        )} updated successfully`
      )

      doFetch({
        keepPagination: true
      })
    })
  }
}
</script>
