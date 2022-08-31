<template>
  <div>
    <app-autocomplete-one-input
      v-model="computedModel"
      :options="platforms"
      :placeholder="placeholder"
      @input="handleInput"
    />
  </div>
</template>

<script>
import AppAutocompleteOneInput from './autocomplete-one-input'
import integrationsJson from '@/jsons/integrations'

export default {
  name: 'AppPlatformAutocompleteInput',
  components: {
    AppAutocompleteOneInput
  },
  props: {
    value: {
      type: String,
      default: null
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      model: null
    }
  },
  computed: {
    platforms() {
      return integrationsJson
        .filter((i) => i.platform !== 'other')
        .map((integration) => {
          return {
            id: integration.platform,
            value: integration.platform,
            label: integration.name
          }
        })
    },
    computedModel: {
      set(value) {
        if (typeof value === 'object' && value) {
          this.model = value.id
        } else {
          this.model = value
        }
      },
      get() {
        return this.platforms.find(
          (i) => i.id === this.model
        )
      }
    }
  },
  watch: {
    value: {
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this.model = newValue
        }
      },
      immediate: true
    }
  },
  methods: {
    handleInput() {
      this.$emit('update:modelValue', this.model)
    }
  }
}
</script>
