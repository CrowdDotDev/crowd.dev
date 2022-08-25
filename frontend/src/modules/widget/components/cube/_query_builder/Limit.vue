<template>
  <div>
    <label class="block leading-none mb-2">Limit</label>
    <el-input
      placeholder="10000"
      v-model="value"
      @change="(v) => $emit('update', v)"
      :disabled="disabled"
    ></el-input>
  </div>
</template>

<script>
export default {
  name: 'Limit',
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
  data() {
    return {
      value: this.limit
    }
  }
}
</script>
