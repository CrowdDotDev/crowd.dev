<template>
  <div>
    <label class="block leading-none mb-2">Limit</label>
    <el-input
      v-model="value"
      placeholder="10000"
      :disabled="disabled"
    ></el-input>
  </div>
</template>

<script>
export default {
  name: 'AppQueryBuilderLimit',
  props: {
    limit: {
      type: Number,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update'],
  computed: {
    value: {
      get() {
        return this.limit
      },
      set(value) {
        this.$emit('update', value)
      }
    }
  }
}
</script>
