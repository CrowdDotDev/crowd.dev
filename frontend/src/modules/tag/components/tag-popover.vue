<template>
  <app-popover :visible="visible" @hide="handleHide">
    <form class="tags-form" v-if="visible">
      <span
        class="flex items-center font-semibold text-base"
        ><i class="ri-pencil-line mr-1"></i>Edit tags</span
      >
      <app-tag-autocomplete-input
        :fetchFn="fields.tags.fetchFn"
        :mapperFn="fields.tags.mapperFn"
        :createIfNotFound="true"
        :value="model"
        @input="handleInput"
        placeholder="Type to search/create tags"
      ></app-tag-autocomplete-input>
    </form>
  </app-popover>
</template>

<script>
import AppPopover from '@/shared/popover/popover'
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'

const { fields } = CommunityMemberModel

export default {
  name: 'app-tag-popover',

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

  computed: {
    fields() {
      return fields
    }
  },

  data() {
    return {
      model: this.value,
      changed: false
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
      this.$emit('input', this.model)
    }
  }
}
</script>
