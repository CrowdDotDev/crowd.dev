<template>
  <div>
    <lf-dropdown
      v-if="hasPermission(LfPermission.noteEdit) || hasPermission(LfPermission.noteDestroy)"
      placement="bottom-end"
      width="14.5rem"
    >
      <template #trigger>
        <lf-button
          type="secondary-ghost"
          size="small"
          :icon-only="true"
        >
          <lf-icon name="ellipsis" />
        </lf-button>
      </template>

      <lf-dropdown-item
        v-if="hasPermission(LfPermission.noteEdit)"
        @click="emit('edit')"
      >
        <lf-icon name="pen" />Edit note
      </lf-dropdown-item>
      <template v-if="hasPermission(LfPermission.noteDestroy)">
        <lf-dropdown-separator />
        <lf-dropdown-item
          type="danger"
          @click="doDestroyWithConfirm"
        >
          <lf-icon name="trash-can" />Delete note
        </lf-dropdown-item>
      </template>
    </lf-dropdown>
  </div>
</template>

<script setup lang="ts">
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { NoteService } from '@/modules/notes/note-service';
import Message from '@/shared/message/message';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import { Note } from '@/modules/notes/types/Note';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  note: Note
}>();

const emit = defineEmits<{(e: 'edit'): any, (e: 'reload'): any,}>();

const { trackEvent } = useProductTracking();
const { hasPermission } = usePermissions();

const doDestroyWithConfirm = () => {
  ConfirmDialog({
    icon: 'fa-light fa-trash-can c-icon',
    type: 'danger',
    title: 'Delete note',
    message:
      'Are you sure you want to proceed? You can’t undo this action',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
  })
    .then(() => {
      trackEvent({
        key: FeatureEventKey.DELETE_NOTE,
        type: EventType.FEATURE,
      });

      return NoteService.destroyAll([props.note.id]);
    })
    .then(() => {
      Message.success('Note successfully deleted!');
      emit('reload');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfNoteDropdown',
};
</script>
