<template>
  <app-popover :visible="visible" @hide="handleHide">
    <form v-if="visible" class="tags-form">
      <span
        class="flex items-center font-semibold text-base"
        ><i class="ri-pencil-line mr-1"></i>Edit tags</span
      >
      <app-tag-autocomplete-input
        :fetch-fn="fields.tags.fetchFn"
        :mapper-fn="fields.tags.mapperFn"
        :create-if-not-found="true"
        :value="model"
        placeholder="Type to search/create tags"
        @input="handleInput"
      ></app-tag-autocomplete-input>
    </form>
  </app-popover>
</template>

<script>
import AppPopover from '@/shared/popover/popover'
import { MemberModel } from '@/modules/member/member-model'

const { fields } = MemberModel

export default {
  name: 'AppTagPopover',

  components: { AppPopover },

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    value: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel', 'update:modelValue'],

  data() {
    return {
      model: this.value,
      changed: false
    }
  },

  computed: {
    fields() {
      return fields
    }
  },

  methods: {
    handleHide() {
      if (this.changed) {
        this.$emit('submit')
      } else {
        this.$emit('cancel')
      }
    },
    handleInput(value) {
      this.model = value
      this.changed = true
      this.$emit('update:modelValue', this.model)
    }
  }
}
</script>
