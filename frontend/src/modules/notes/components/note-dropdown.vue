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
          <lf-icon name="more-fill" />
        </lf-button>
      </template>

      <lf-dropdown-item
        v-if="hasPermission(LfPermission.noteEdit)"
        @click="emit('edit')"
      >
        <lf-icon name="pencil-line" />Edit note
      </lf-dropdown-item>
      <lf-dropdown-separator />
      <lf-dropdown-item
        v-if="hasPermission(LfPermission.noteDestroy)"
        type="danger"
        @click="doDestroyWithConfirm"
      >
        <lf-icon name="delete-bin-6-line" />Delete note
      </lf-dropdown-item>
    </lf-dropdown>
  </div>
</template>

<script setup>
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { NoteService } from '@/modules/notes/note-service';
import Message from '@/shared/message/message';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';

const emit = defineEmits(['edit', 'reload']);

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
});

const { trackEvent } = useProductTracking();
const { hasPermission } = usePermissions();

const doDestroyWithConfirm = () => {
  ConfirmDialog({
    icon: 'ri-delete-bin-line',
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

<script>
export default {
  name: 'AppNoteDropdown',
};
</script>
