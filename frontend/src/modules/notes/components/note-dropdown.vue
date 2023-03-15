<template>
  <div>
    <el-dropdown
      placement="bottom-end"
      trigger="click"
      @command="handleCommand"
      @visible-change="dropdownVisible = $event"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item
          command="noteEdit"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-pencil-line text-gray-400 mr-1" />
          <span>Edit note</span></el-dropdown-item
        >
        <el-dropdown-item
          command="noteDelete"
          divided="divided"
          :disabled="isDeleteLockedForSampleData"
        >
          <i class="ri-delete-bin-line text-red-500 mr-1" />
          <span class="text-red-500">Delete note</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'AppNoteDropdown'
}
</script>

<script setup>
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'
import {
  ref,
  defineEmits,
  defineProps,
  computed
} from 'vue'
import { NoteService } from '@/modules/notes/note-service'
import Message from '@/shared/message/message'
import { NotePermissions } from '../note-permissions'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const emit = defineEmits(['edit', 'reload'])

const props = defineProps({
  note: {
    type: Object,
    required: true
  }
})

const dropdownVisible = ref(false)

const { currentTenant, currentUser } = mapGetters('auth')
const isEditLockedForSampleData = computed(() => {
  return new NotePermissions(
    currentTenant.value,
    currentUser.value
  ).editLockedForSampleData
})
const isDeleteLockedForSampleData = computed(() => {
  return new NotePermissions(
    currentTenant.value,
    currentUser.value
  ).destroyLockedForSampleData
})

const handleCommand = (command) => {
  if (command === 'noteDelete') {
    return doDestroyWithConfirm()
  } else if (command === 'noteEdit') {
    emit('edit')
  }
}

const doDestroyWithConfirm = () => {
  ConfirmDialog({
    icon: 'ri-delete-bin-line',
    type: 'danger',
    title: 'Delete note',
    message:
      'Are you sure you want to proceed? You can’t undo this action',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel'
  })
    .then(() => {
      return NoteService.destroyAll([props.note.id])
    })
    .then(() => {
      Message.success('Note successfully deleted!')
      emit('reload')
    })
}
</script>
