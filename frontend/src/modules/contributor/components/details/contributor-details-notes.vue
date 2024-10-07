<template>
  <div v-if="hasPermission(LfPermission.noteCreate)" v-bind="$attrs">
    <lf-note-editor
      :properties="{ members: [props.contributor.id] }"
      @created="fetchNotes()"
    />
  </div>
  <div v-else-if="!notes.length" class="w-full text-gray-400 italic text-small">
    You don't have permissions to create notes.
  </div>
  <div class="pt-2">
    <lf-note-item
      v-for="note of notes"
      :key="note.id"
      :note="note"
      @reload="fetchNotes(0)"
    />
    <div
      v-if="notesCount > notes.length"
      class="pt-10 pb-6 gap-4 flex justify-center items-center"
    >
      <p class="text-small text-gray-400">
        {{ notes.length }} of {{ notesCount }} notes
      </p>
      <lf-button
        type="primary-ghost"
        loading-text="Loading notes..."
        :loading="loadingNotes"
        @click="loadMore()"
      >
        Load more
      </lf-button>
    </div>
    <div v-if="notesCount === 0" class="pt-14">
      <div class="flex justify-center pb-4">
        <lf-icon-old name="draft-line" :size="80" class="text-gray-300" />
      </div>
      <p class="text-medium text-gray-400 text-center">
        No notes yet
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { NoteService } from '@/modules/notes/note-service';
import LfNoteEditor from '@/modules/notes/components/note-editor.vue';
import LfNoteItem from '@/modules/notes/components/note-item.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';

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

const loadMore = () => {
  if (notesCount.value > notes.value.length) {
    fetchNotes(notesPage.value + 1);
  }
};

onMounted(() => {
  fetchNotes();
});

defineExpose({
  loadMore,
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsNotes',
};
</script>
