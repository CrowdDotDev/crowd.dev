<template>
  <div class="pt-8">
    <app-note-editor
      :properties="{ members: [props.member.id] }"
      @created="fetchNotes()"
    />
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
        ><i class="ri-arrow-down-line"></i
        ><span class="text-xs">Load more</span></el-button
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewNotes'
}
</script>

<script setup>
import { defineProps, onMounted, ref } from 'vue'
import AppNoteEditor from '@/modules/notes/components/note-editor'
import AppNoteItem from '@/modules/notes/components/note-item'
import { NoteService } from '@/modules/notes/note-service'

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
})

const notes = ref([])
const notesCount = ref(0)
const notesPage = ref(0)
const notesLimit = 20

onMounted(() => {
  fetchNotes()
})

const fetchNotes = (page = 0) => {
  notesPage.value = page
  NoteService.list(
    {
      members: [props.member.id]
    },
    'createdAt_DESC',
    notesLimit,
    notesPage.value * notesLimit
  ).then(({ rows, count }) => {
    if (notesPage.value > 0) {
      notes.value = [...notes.value, ...rows]
    } else {
      notes.value = rows
    }
    notesCount.value = count
  })
}
</script>
