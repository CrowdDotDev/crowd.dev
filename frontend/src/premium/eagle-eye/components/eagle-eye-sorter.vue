<template>
  <div
    class="eagle-eye-sorter -mr-3"
    :style="computedWidth"
  >
    <el-select
      v-model="computedValue"
      popper-class="eagle-eye-popper-class"
      prefix="sort"
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
            ? '160px'
            : '135px'
      }
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

<style lang="scss">
.el-select-dropdown.eagle-eye-popper-class {
  .popper__arrow {
    left: unset !important;
    right: 35px;
  }
}
.eagle-eye-sorter {
  .el-select {
    &:hover,
    &:focus {
      @apply shadow-none;
    }

    .el-input {
      &__wrapper {
        @apply bg-transparent border-none text-left shadow-none;
        &:hover {
          @apply shadow-none;
        }
      }
      &.is-focus .el-input__wrapper {
        box-shadow: none !important;
      }
      &__prefix {
        @apply flex items-center mr-2 text-gray-400;
      }
    }
  }
}
</style>
