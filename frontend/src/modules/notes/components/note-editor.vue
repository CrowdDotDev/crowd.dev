<template>
  <div>
    <div class="relative w-full">
      <app-editor
        ref="editor"
        v-model="noteText"
        :placeholder="
          props.note ? 'Note...' : 'Add note...'
        "
        class="border rounded-md pt-2 px-3 pb-10"
        :class="{
          'border-gray-600': noteEditorFocused,
          'border-gray-300': !noteEditorFocused,
          'hover:border-gray-400': !noteEditorFocused,
        }"
        @focus="noteEditorFocused = true"
        @blur="noteEditorFocused = false"
        @keydown.enter="keydownSubmit($event)"
        @keydown.esc="cancel()"
      />
      <div
        class="absolute right-3 transition-all transition-200 bottom-3"
      >
        <div class="flex gap-3">
          <lf-button v-if="noteText?.length > 0" type="secondary-ghost-light" @click="cancel()">
            Cancel
          </lf-button>

          <lf-button type="secondary" :disabled="noteText?.length === 0" @click="submit()">
            {{ props.note ? 'Update' : 'Add note' }}
          </lf-button>
        </div>
      </div>
    </div>
    <div
      v-if="!hideSuggestion"
      class="pt-2 text-tiny text-gray-500 overflow-hidden transition-all"
      :class="
        noteEditorFocused
          ? 'h-7 opacity-1'
          : 'h-0 opacity-0'
      "
    >
      <span class="font-semibold">Suggestion:</span> use
      Markdown syntax to format your note
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
} from 'vue';
import { NoteService } from '@/modules/notes/note-service';
import AppEditor from '@/shared/form/editor.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import { Note } from '@/modules/notes/types/Note';

const props = defineProps<{
  properties?: any,
  note?: Note,
  hideSuggestion?: boolean,
}>();

const emit = defineEmits<{(e: 'created'): any,
  (e: 'updated'): any,
  (e: 'cancel'): any,
}>();

const noteText = ref<string>('');
const editor = ref<any>(null);
const noteEditorFocused = ref<boolean>(false);

const { trackEvent } = useProductTracking();

onMounted(() => {
  if (props.note) {
    noteText.value = props.note.body;
  }
});

const clear = () => {
  noteText.value = '';
  editor.value.clear();
};

const focus = () => {
  editor.value.focus();
};

const cancel = () => {
  emit('cancel');
  clear();
};

const submit = () => {
  if (props.note) {
    trackEvent({
      key: FeatureEventKey.EDIT_NOTE,
      type: EventType.FEATURE,
    });

    NoteService.update(props.note.id, {
      members: props.note.members.map((m) => m.id),
      body: noteText.value,
    }).then(() => {
      emit('updated');
    });
  } else {
    trackEvent({
      key: FeatureEventKey.ADD_NOTE,
      type: EventType.FEATURE,
    });

    NoteService.create({
      body: noteText.value,
      ...props.properties,
    }).then(() => {
      clear();
      emit('created');
    });
  }
};

const keydownSubmit = (event) => {
  if (event.metaKey || event.ctrlKey) {
    submit();
  }
};

defineExpose({
  focus,
  editor,
});
</script>

<script lang="ts">
export default {
  name: 'LfNoteEditor',
};
</script>
