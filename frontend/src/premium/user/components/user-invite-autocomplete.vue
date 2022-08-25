<template>
  <app-autocomplete-many-input
    :createIfNotFound="true"
    :createFn="handleCreate"
    createPrefix="Invite"
    v-model="model"
    placeholder="Type in the emails to invite"
  />
</template>
<script>
import AppAutocompleteManyInput from '@/shared/form/autocomplete-many-input'
export default {
  name: 'app-user-invite-autocomplete',
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  components: {
    AppAutocompleteManyInput
  },
  data() {
    return {
      model: []
    }
  },
  watch: {
    model: {
      deep: true,
      handler(newValue) {
        this.$emit('input', newValue)
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
