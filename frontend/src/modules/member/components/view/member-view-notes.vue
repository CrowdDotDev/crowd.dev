<template>
  <div v-if="!isCreateLockedForSampleData" class="pt-8">
    <app-note-editor
      :properties="{ members: [props.member.id] }"
      @created="fetchNotes()"
    />
  </div>
  <div
    v-else
    class="w-full text-gray-400 pt-8 italic text-sm"
  >
    Connect integrations to add notes to members
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
      :fetch-fn="fetchNotes(notesPage + 1)"
    />
  </div>
</template>

<script setup>
import {
  computed, defineProps, onMounted, ref,
} from 'vue';
import { NoteService } from '@/modules/notes/note-service';
import { NotePermissions } from '@/modules/notes/note-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppNoteItem from '@/modules/notes/components/note-item.vue';
import AppNoteEditor from '@/modules/notes/components/note-editor.vue';
import AppLoadMore from '@/shared/button/load-more.vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const { currentTenant, currentUser } = mapGetters('auth');
const notes = ref([]);
const notesCount = ref(0);
const notesPage = ref(0);
const notesLimit = 20;
const loadingNotes = ref(false);

const isCreateLockedForSampleData = computed(() => new NotePermissions(
  currentTenant.value,
  currentUser.value,
).createLockedForSampleData);

const fetchNotes = (page = 0) => {
  loadingNotes.value = true;
  notesPage.value = page;
  NoteService.list(
    {
      members: [props.member.id],
    },
    'createdAt_DESC',
    notesLimit,
    notesPage.value * notesLimit,
  ).then(({ rows, count }) => {
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
