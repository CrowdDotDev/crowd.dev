<template>
  <div class="eagle-eye-sorter">
    <app-inline-select-input
      v-model="computedValue"
      popper-class="sorter-popper-class"
      popper-placement="bottom-start"
      prefix="Sort:"
      :options="options"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppInlineSelectInput from '@/shared/form/inline-select-input'
export default {
  name: 'AppEagleEyeSorter',
  components: { AppInlineSelectInput },
  data() {
    return {
      options: [
        {
          value: 'similarityScore',
          label: 'Relevance'
        },
        {
          value: 'timestamp',
          label: 'Latest'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      activeView: 'eagleEye/activeView'
    }),
    sorter() {
      return this.activeView.sorter
    },
    computedValue: {
      get() {
        return this.sorter.prop
      },
      set(v) {
        this.handleChange(v)
      }
    }
  },
  created() {
    this.value = this.sorter.prop
  },
  methods: {
    ...mapActions({
      doChangeSort: 'eagleEye/doChangeSort'
    }),
    async handleChange(value) {
      this.value = value
      await this.doChangeSort({
        prop: this.value,
        order: 'descending'
      })
    }
  }
}
</script>
