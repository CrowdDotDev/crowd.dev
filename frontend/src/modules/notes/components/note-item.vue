<template>
  <article class="border-t border-gray-200 py-4">
    <div class="flex items-center justify-between pb-4">
      <div class="flex items-center">
        <app-avatar
          :entity="entity"
          size="xxs"
          class="h-6 w-6 mr-2"
        />
        <p class="text-2xs leading-5 text-gray-500">
          {{ props.note.createdBy.fullName }} ・
          {{ timeAgo(props.note.createdAt) }}
        </p>
      </div>
      <app-note-dropdown
        v-if="props.note.createdById === user.id && hasPermission(LfPermission.noteEdit)"
        :note="props.note"
        @edit="edit()"
        @reload="emit('reload')"
      />
    </div>
    <div
      v-if="!editing"
      class="c-content text-sm leading-5"
      v-html="$sanitize(props.note.body)"
    />
    <app-note-editor
      v-else-if="hasPermission(LfPermission.noteEdit)"
      ref="editor"
      :hide-avatar="true"
      :hide-suggestion="true"
      :note="props.note"
      @updated="updated()"
      @cancel="editing = false"
    />
  </article>
</template>

<script setup>
import {
  ref,
  nextTick,
  computed,
} from 'vue';
import { formatDateToTimeAgo } from '@/utils/date';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppNoteDropdown from '@/modules/notes/components/note-dropdown.vue';
import AppNoteEditor from '@/modules/notes/components/note-editor.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['reload']);

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const { hasPermission } = usePermissions();

const timeAgo = formatDateToTimeAgo;
const editor = ref(null);
const editing = ref(false);

const entity = computed(() => ({
  avatar: props.note.createdBy.avatarUrl,
  displayName: props.note.createdBy.fullName,
}));

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

<script>
export default {
  name: 'AppNoteItem',
};
</script>
