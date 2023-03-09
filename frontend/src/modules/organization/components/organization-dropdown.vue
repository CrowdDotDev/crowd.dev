<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill"></i>
      </button>
      <template #dropdown>
        <!-- Edit -->
        <el-dropdown-item
          :command="{
            action: 'organizationEdit',
            organization
          }"
          class="h-10"
          ><i class="ri-pencil-line text-base mr-2" /><span
            class="text-xs text-gray-900"
            >Edit organization</span
          ></el-dropdown-item
        >

        <!-- Mark as Team Organization -->
        <el-dropdown-item
          v-if="!organization.isTeamOrganization"
          :command="{
            action: 'markOrganizationTeam',
            organization,
            value: true
          }"
          class="h-10"
          ><i
            class="ri-bookmark-line text-base mr-2"
          /><span class="text-xs text-gray-900"
            >Mark as team organization</span
          ></el-dropdown-item
        >

        <!-- Unmark as Team Organization -->
        <el-dropdown-item
          v-if="organization.isTeamOrganization"
          :command="{
            action: 'markOrganizationTeam',
            organization,
            value: false
          }"
          class="h-10"
          ><i
            class="ri-bookmark-2-line text-base mr-2"
          /><span class="text-xs text-gray-900"
            >Unmark as team organization</span
          ></el-dropdown-item
        >

        <el-divider class="border-gray-200 my-2" />

        <!-- Delete -->
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'organizationDelete',
            organization
          }"
          ><i
            class="ri-delete-bin-line text-base mr-2 text-red-500"
          /><span class="text-xs text-red-500"
            >Delete organization</span
          >
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'AppOrganizationDropdown'
}
</script>

<script setup>
import { computed, defineProps } from 'vue'
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { OrganizationPermissions } from '../organization-permissions'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import { OrganizationService } from '../organization-service'
import Message from '@/shared/message/message'

const router = useRouter()

defineProps({
  organization: {
    type: Object,
    default: () => {}
  }
})

const { currentUser, currentTenant } = mapGetters('auth')
const { doDestroy, doFetch, doFind } =
  mapActions('organization')

const isReadOnly = computed(
  () =>
    new OrganizationPermissions(
      currentTenant.value,
      currentUser.value
    ).edit === false
)

const doDestroyWithConfirm = async (id) => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title: 'Delete organization',
      message:
        "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line'
    })

    return doDestroy(id)
  } catch (error) {
    console.log(error)
  }
}

const handleCommand = (command) => {
  if (command.action === 'organizationDelete') {
    return doDestroyWithConfirm(command.organization.id)
  } else if (command.action === 'organizationEdit') {
    router.push({
      name: 'organizationEdit',
      params: {
        id: command.organization.id
      }
    })
  } else if (command.action === 'markOrganizationTeam') {
    OrganizationService.update(command.organization.id, {
      isTeamOrganization: command.value
    }).then(() => {
      Message.success('Organization updated successfully')

      if (
        router.currentRoute.value.name === 'organization'
      ) {
        doFetch({
          keepPagination: false
        })
      } else {
        doFind(command.organization.id)
      }
    })
  }
}
</script>
