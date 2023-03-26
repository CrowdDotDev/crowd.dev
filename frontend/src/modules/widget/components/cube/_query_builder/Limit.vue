<template>
  <div>
    <label
      for="formLimit"
      class="block leading-none text-xs font-semibold mb-2"
    >Limit</label>
    <el-input
      id="formLimit"
      v-model="value"
      placeholder="10000"
      :disabled="disabled"
    />
  </div>
</template>

<script>
export default {
  name: 'AppQueryBuilderLimit',
  props: {
    limit: {
      type: Number,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update'],
  computed: {
    value: {
      get() {
        return this.limit;
      },
      set(value) {
        this.$emit('update', value);
      },
    },
  },
};
</script>
