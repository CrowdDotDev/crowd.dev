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
    Connect integrations to add notes to contributors
  </div>
  <div v-if="notes.length > 0" class="pt-6">
    <app-note-item
      v-for="note of notes"
      :key="note.id"
      :note="note"
      @reload="fetchNotes()"
    />
    <div
      v-if="notesCount > notes.length"
      class="flex justify-center pt-4"
    >
      <el-button
        class="btn btn-brand btn-brand--transparent"
        @click="fetchNotes(notesPage + 1)"
      >
        <i class="ri-arrow-down-line" /><span class="text-xs">Load more</span>
      </el-button>
    </div>
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

const isCreateLockedForSampleData = computed(() => new NotePermissions(
  currentTenant.value,
  currentUser.value,
).createLockedForSampleData);

const fetchNotes = (page = 0) => {
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
