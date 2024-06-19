<template>
  <article class="border-t border-gray-200 first:border-0 py-5">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2">
      <div class="flex items-center">
        <lf-avatar
          :src="props.note.createdBy.avatarUrl"
          :name="props.note.createdBy.fullName"
          :size="24"
        />
        <p class="pl-2 text-small text-gray-400">
          {{ props.note.createdBy.fullName }} ・
          {{ timeAgo(props.note.createdAt) }}
        </p>
      </div>
      <lf-note-dropdown
        v-if="props.note.createdById === user.id && hasPermission(LfPermission.noteEdit)"
        :note="props.note"
        @edit="edit()"
        @reload="emit('reload')"
      />
    </div>

    <!-- Content -->
    <div
      v-if="!editing"
      class="c-content text-medium"
      v-html="$sanitize(props.note.body)"
    />
    <lf-note-editor
      v-else-if="hasPermission(LfPermission.noteEdit)"
      ref="editor"
      :hide-suggestion="true"
      :note="props.note"
      @updated="updated()"
      @cancel="editing = false"
    />
  </article>
</template>

<script setup lang="ts">
import {
  ref,
  nextTick,
} from 'vue';
import { formatDateToTimeAgo } from '@/utils/date';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Note } from '@/modules/notes/types/Note';
import LfNoteDropdown from '@/modules/notes/components/note-dropdown.vue';
import LfNoteEditor from '@/modules/notes/components/note-editor.vue';

const props = defineProps<{
  note: Note,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const { hasPermission } = usePermissions();

const timeAgo = formatDateToTimeAgo;
const editor = ref<any | null>(null);
const editing = ref<boolean>(false);

const edit = () => {
  editing.value = true;
  nextTick(() => {
    editor.value.focus();
  });
};

const updated = () => {
  editing.value = false;
  emit('reload');
};

defineExpose({ editor });
</script>

<script lang="ts">
export default {
  name: 'LfNoteItem',
};
</script>
