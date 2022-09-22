<template>
  <div>
    <app-autocomplete-one-input
      v-model="computedModel"
      :options="platforms"
      :placeholder="placeholder"
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
    modelValue: {
      type: String,
      default: null
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],
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
          this.$emit('update:modelValue', value.id)
        } else {
          this.$emit('update:modelValue', this.model)
        }
      },
      get() {
        return this.platforms.find(
          (i) => i.id === this.modelValue
        )
      }
    }
  }
}
</script>
