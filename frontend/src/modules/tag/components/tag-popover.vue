<template>
  <app-popover :visible="visible" @hide="handleHide">
    <form v-if="visible" class="tags-form">
      <span
        class="flex items-center font-semibold text-base"
        ><i class="ri-pencil-line mr-1"></i>Edit tags</span
      >
      <app-tag-autocomplete-input
        v-model="model"
        :fetch-fn="fields.tags.fetchFn"
        :mapper-fn="fields.tags.mapperFn"
        :create-if-not-found="true"
        placeholder="Type to search/create tags"
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
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel', 'update:modelValue'],

  data() {
    return {
      changed: false
    }
  },

  computed: {
    fields() {
      return fields
    },
    model: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.changed = true
        this.$emit('update:modelValue', value)
      }
    }
  },

  methods: {
    handleHide() {
      if (this.changed) {
        this.$emit('submit')
      } else {
        this.$emit('cancel')
      }
    }
  }
}
</script>
