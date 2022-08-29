<template>
  <div
    class="eagle-eye-sorter -mr-3"
    :style="computedWidth"
  >
    <el-select
      :value="value"
      popper-class="eagle-eye-popper-class"
      prefix="sort"
      @change="handleChange"
    >
      <template #prefix>Sort:</template>
      <el-option
        key="relevance"
        value="similarityScore"
        label="Relevance"
      ></el-option>
      <el-option
        key="latest"
        value="timestamp"
        label="Latest"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'AppEagleEyeSorter',
  data() {
    return {
      value: 'similarityScore'
    }
  },
  computed: {
    ...mapGetters({
      sorter: 'eagleEye/sorter'
    }),
    computedWidth() {
      return {
        width:
          this.value === 'similarityScore'
            ? '140px'
            : '116px'
      }
    }
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
  },
  created() {
    this.value = this.sorter.prop
  }
}
</script>

<style lang="scss">
.el-select-dropdown.eagle-eye-popper-class {
  .popper__arrow {
    left: unset !important;
    right: 35px;
  }
}
.eagle-eye-sorter {
  .el-input {
    &__inner {
      @apply bg-transparent border-none text-left pr-8 pl-10;
    }
    &__prefix {
      @apply flex items-center mr-2 text-gray-400;
    }
  }
}
</style>
