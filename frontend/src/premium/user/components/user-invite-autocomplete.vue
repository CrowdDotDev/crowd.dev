<template>
  <app-autocomplete-many-input
    v-model="model"
    :create-if-not-found="true"
    :create-fn="handleCreate"
    create-prefix="Invite"
    placeholder="Type in the emails to invite"
  />
</template>
<script>
import AppAutocompleteManyInput from '@/shared/form/autocomplete-many-input'
export default {
  name: 'AppUserInviteAutocomplete',
  components: {
    AppAutocompleteManyInput
  },
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      model: []
    }
  },
  watch: {
    model: {
      deep: true,
      handler(newValue) {
        this.$emit('update:modelValue', newValue)
      }
    },
    value: {
      deep: true,
      immediate: true,
      handler(newValue) {
        this.model = newValue
      }
    }
  },
  methods: {
    handleCreate(value) {
      return value
    }
  }
}
</script>
