<template>
  <div>
    <app-autocomplete-one-input
      v-model="computedModel"
      @input="handleInput"
      :options="platforms"
      :placeholder="placeholder"
    />
  </div>
</template>

<script>
import AppAutocompleteOneInput from './autocomplete-one-input'
import integrationsJson from '@/jsons/integrations'

export default {
  name: 'app-platform-autocomplete-input',
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
  data() {
    return {
      model: null
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
      this.$emit('input', this.model)
    }
  }
}
</script>
