<template>
  <div v-if="hasPermission(LfPermission.noteCreate)" v-bind="$attrs">
    <app-note-editor
      :properties="{ members: [props.contributor.id] }"
      @created="fetchNotes()"
    />
  </div>
  <div v-else-if="!notes.length" class="w-full text-gray-400 pt-8 italic text-small">
    You don't have permissions to create notes.
  </div>
  <div class="pt-6">
    <app-note-item
      v-for="note of notes"
      :key="note.id"
      :note="note"
      @reload="fetchNotes(0)"
    />
  </div>
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import AppNoteEditor from '@/modules/notes/components/note-editor.vue';
import AppNoteItem from '@/modules/notes/components/note-item.vue';
import { onMounted, ref } from 'vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { NoteService } from '@/modules/notes/note-service';

const props = defineProps<{
  contributor: Contributor,
}>();

const notes = ref<any[]>([]);
const notesCount = ref<number>(0);
const notesPage = ref<number>(0);
const notesLimit = 20;
const loadingNotes = ref(false);

const { hasPermission } = usePermissions();

const fetchNotes = (page = 0) => {
  loadingNotes.value = true;
  notesPage.value = page;
  NoteService.list({
    filter: {
      members: [props.contributor.id],
    },
    orderBy: 'createdAt_DESC',
    limit: notesLimit,
    offset: notesPage.value * notesLimit,
    segments: props.contributor.segments.map((s) => s.id),
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

<script lang="ts">
export default {
  name: 'LfContributorDetailsNotes',
};
</script>
