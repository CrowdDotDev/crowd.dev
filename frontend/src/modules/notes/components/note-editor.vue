<template>
  <div class="flex">
    <div v-if="!hideAvatar" class="pt-2 pr-3">
      <app-avatar
        size="xxs"
        class="h-6 w-6"
        :entity="computedAvatarEntity"
      />
    </div>
    <div class="flex-grow">
      <div class="relative">
        <app-editor
          ref="editor"
          v-model="note"
          :placeholder="
            props.note ? 'Note...' : 'Add note...'
          "
          class="border border-gray-300 rounded-md pt-2 px-3 pb-10"
          :class="{
            'border-gray-600': noteEditorFocused,
            'hover:border-gray-400': !noteEditorFocused
          }"
          @focus="noteEditorFocused = true"
          @blur="noteEditorFocused = false"
          @keydown.enter="keydownSubmit($event)"
          @keydown.esc="cancel()"
        />
        <div
          class="absolute right-3 transition-all transition-200"
          :class="
            noteEditorFocused || note.length
              ? 'bottom-3 opacity-1'
              : 'bottom-0 opacity-0'
          "
        >
          <div class="flex">
            <el-tooltip
              effect="dark"
              content="Cancel"
              placement="top"
            >
              <div
                class="ri-close-circle-fill text-2xl text-gray-300 flex items-center h-8 mr-2 transition hover:text-gray-400 cursor-pointer"
                @click="cancel()"
              ></div>
            </el-tooltip>
            <el-tooltip
              effect="dark"
              :content="props.note ? 'Save' : 'Add note'"
              placement="top"
              :disabled="note.length === 0"
            >
              <div
                class="text-2xl flex items-center h-8 transition"
                :class="[
                  note.length > 0
                    ? 'text-gray-900 hover:text-gray-600 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed',
                  props.note
                    ? 'ri-checkbox-circle-fill'
                    : 'ri-arrow-up-circle-fill'
                ]"
                @click="submit()"
              ></div>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div
        v-if="!hideSuggestion"
        class="pt-2 text-2xs leading-5 text-gray-500 overflow-hidden transition-all"
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
  </div>
</template>

<script>
export default {
  name: 'AppNoteEditor'
}
</script>

<script setup>
import AppEditor from '@/shared/form/editor'
import {
  computed,
  ref,
  defineProps,
  defineEmits,
  onMounted,
  defineExpose
} from 'vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import AppAvatar from '@/shared/avatar/avatar'
import { NoteService } from '@/modules/notes/note-service'

const props = defineProps({
  properties: {
    type: Object,
    required: false,
    default: () => ({})
  },
  note: {
    type: Object,
    required: false,
    default: null
  },
  hideAvatar: {
    type: Boolean,
    required: false,
    default: false
  },
  hideSuggestion: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['created', 'updated', 'cancel'])

const note = ref('')
const editor = ref('')
const noteEditorFocused = ref(false)

const { currentUserNameOrEmailPrefix, currentUserAvatar } =
  mapGetters('auth')

const computedAvatarEntity = computed(() => ({
  avatar: currentUserAvatar.value,
  displayName: currentUserNameOrEmailPrefix.value
}))

onMounted(() => {
  if (props.note) {
    note.value = props.note.body
  }
})

const cancel = () => {
  emit('cancel')
  clear()
}

const clear = () => {
  note.value = ''
  editor.value.clear()
}

const focus = () => {
  editor.value.focus()
}

const keydownSubmit = (event) => {
  if (event.metaKey || event.ctrlKey) {
    submit()
  }
}

const submit = () => {
  if (props.note) {
    NoteService.update(props.note.id, {
      members: props.note.members.map((m) => m.id),
      body: note.value
    }).then(() => {
      emit('updated')
    })
  } else {
    NoteService.create({
      body: note.value,
      ...props.properties
    }).then(() => {
      clear()
      emit('created')
    })
  }
}

defineExpose({
  focus,
  editor
})
</script>
