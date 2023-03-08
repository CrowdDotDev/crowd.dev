<template>
  <editor-content
    class="editor c-content w-full text-sm leading-5 flex flex-col"
    :data-placeholder="placeholder"
    :value="modelValue"
    :style="{ 'min-height': minHeight }"
    :editor="editor"
  />
</template>

<script>
export default {
  name: 'AppEditor'
}
</script>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  ref,
  defineProps,
  defineEmits,
  watch,
  onBeforeMount,
  defineExpose
} from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    required: false,
    default: ''
  },
  minHeight: {
    type: String,
    required: false,
    default: '84px'
  },
  overrideExtensions: {
    type: Boolean,
    required: false,
    default: false
  },
  extensions: {
    type: Array,
    required: false,
    default: () => []
  }
})

const emit = defineEmits([
  'update:modelValue',
  'focus',
  'blur'
])

const valueProxy = ref('')

const defaultExtensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: props.placeholder
  }),
  Link.configure({
    openOnClick: false
  })
]

const editor = useEditor({
  content: props.modelValue,
  extensions: props.overrideExtensions
    ? props.extensions
    : [...defaultExtensions, ...props.extensions],
  onUpdate: () => {
    if (editor.value) {
      valueProxy.value = editor.value.getHTML()
      const noTags = valueProxy.value
        .replace('<p>', '')
        .replace('</p>', '')
        .trim()
      if (noTags.length === 0) {
        valueProxy.value = ''
        editor.value.commands.setContent('', false)
      }
      emit('update:modelValue', valueProxy.value)
    }
  },
  onFocus: () => {
    emit('focus')
  },
  onBlur: () => {
    emit('blur')
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value) {
      if (valueProxy.value === val && val.length > 0) {
        return
      }
      valueProxy.value = val
      editor.value.commands.setContent(val, false)
    }
  }
)

onBeforeMount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

const focus = () => {
  editor.value.commands.focus()
}

const blur = () => {
  editor.value.commands.blur()
}

const clear = () => {
  editor.value.commands.clearContent()
}

defineExpose({
  focus,
  blur,
  clear
})
</script>

<style lang="scss">
.ProseMirror {
  min-height: 100%;
  flex-grow: 1;

  &-focused {
    outline: none;
    border: 0;
  }

  p.is-editor-empty:first-child::before {
    @apply text-gray-400;
    content: attr(data-placeholder);
    float: left;
    pointer-events: none;
    height: 0;
  }

  [data-type='mention'] {
    padding: 0 4px;
    border-radius: 4px;
    display: inline-block;
    border: solid 1px var(--color-primary-10);
    color: var(--color-primary-100);
    background: var(--color-primary-5);
  }
}

.editor {
  white-space: pre-line;
  overflow: auto;
}
</style>
