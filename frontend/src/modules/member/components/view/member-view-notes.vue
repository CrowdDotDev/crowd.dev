<template>
  <div v-if="hasPermission(LfPermission.noteCreate)" class="pt-8" v-bind="$attrs">
    <app-note-editor
      :properties="{ members: [props.member.id] }"
      @created="fetchNotes()"
    />
  </div>
  <div v-else-if="!notes.length" class="w-full text-gray-400 pt-8 italic text-sm">
    You don't have permissions to create notes.
  </div>
  <div class="pt-6">
    <app-note-item
      v-for="note of notes"
      :key="note.id"
      :note="note"
      @reload="fetchNotes()"
    />
    <app-load-more
      :is-visible="notesCount > notes.length"
      :is-loading="loadingNotes"
      :fetch-fn="() => fetchNotes(notesPage + 1)"
    />
  </div>
</template>

<script setup>
import {
  onMounted, ref,
} from 'vue';
import { NoteService } from '@/modules/notes/note-service';
import AppNoteItem from '@/modules/notes/components/note-item.vue';
import AppLoadMore from '@/shared/button/load-more.vue';
import AppNoteEditor from '@/modules/notes/components/note-editor.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const notes = ref([]);
const notesCount = ref(0);
const notesPage = ref(0);
const notesLimit = 20;
const loadingNotes = ref(false);

const { hasPermission } = usePermissions();

const fetchNotes = (page = 0) => {
  loadingNotes.value = true;
  notesPage.value = page;
  NoteService.list({
    filter: {
      members: [props.member.id],
    },
    orderBy: 'createdAt_DESC',
    limit: notesLimit,
    offset: notesPage.value * notesLimit,
    segments: props.member.segments.map((s) => s.id),
  }).then(({ rows, count }) => {
    if (notesPage.value > 0) {
      notes.value = [...notes.value, ...rows];
    } else {
      notes.value = rows;
    }
    notesCount.value = count;
  }).finally(() => {
    loadingNotes.value = false;
  });
};

onMounted(() => {
  fetchNotes();
});
</script>

<script>
export default {
  name: 'AppMemberViewNotes',
};
</script>
