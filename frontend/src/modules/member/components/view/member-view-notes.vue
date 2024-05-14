<template>
  <div
    class="w-full text-gray-400 pt-8 italic text-sm"
  >
    Connect integrations to add notes to contributors
  </div>
  <div v-if="notes.length > 0" class="pt-6">
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
