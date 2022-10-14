<template>
  <el-dialog v-model="computedVisible">
    <template #header>
      <h5>Edit tags</h5>
    </template>
    <form v-if="visible" class="tags-form mb-10">
      <app-tag-autocomplete-input
        v-model="model"
        :fetch-fn="fields.tags.fetchFn"
        :mapper-fn="fields.tags.mapperFn"
        :create-if-not-found="true"
        placeholder="Type to search/create tags"
      ></app-tag-autocomplete-input>
    </form>

    <div
      class="bg-gray-50 rounded-b-md -mx-5 -mb-8 py-5 px-5 flex items-center justify-end"
    >
      <el-button
        class="btn btn--bordered btn--md mr-3"
        @click="handleCancel"
        >Cancel</el-button
      >
      <el-button
        class="btn btn--primary btn--md"
        @click="handleSubmit"
        >Submit</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
import { MemberModel } from '@/modules/member/member-model'

const { fields } = MemberModel

export default {
  name: 'AppTagPopover',

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
    },
    computedVisible: {
      get() {
        return this.visible
      },
      set() {
        this.handleCancel()
      }
    }
  },

  methods: {
    handleCancel() {
      this.$emit('cancel')
    },
    handleSubmit() {
      this.$emit('submit')
    }
  }
}
</script>
