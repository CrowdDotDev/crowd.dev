<template>
  <div v-if="items.length">
    <div class="filter-preview">
      <span class="filter-preview-values">
        <el-tag
          :key="item.label"
          v-for="item of items"
          type="info"
          closable
          @close="onRemove(item.key)"
          >{{ item.label }}: {{ item.value }}</el-tag
        >
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-filter-preview',
  props: ['values', 'fields', 'expanded'],

  computed: {
    items() {
      return Object.keys(this.values || {})
        .map((key) => {
          if (!this.fields[key]) {
            return {
              value: null
            }
          }

          return {
            key: key,
            label: this.fields[key].label,
            value: this.fields[key].forFilterPreview(
              this.values[key]
            )
          }
        })
        .filter(
          (item) =>
            item.value ||
            item.value === 0 ||
            item.value === false
        )
    }
  },

  methods: {
    onRemove(key) {
      this.$emit('remove', key)
    }
  }
}
</script>
