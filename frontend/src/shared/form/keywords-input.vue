<template>
  <div>
    <div
      class="el-keywords-input-wrapper"
      :class="focused ? 'is-focus' : ''"
      @click="focusKeywordInput"
    >
      <el-tag
        v-for="(keyword, idx) in innerKeywords"
        v-bind="$attrs"
        :key="keyword"
        size="small"
        type="info"
        effect="light"
        :disable-transitions="true"
        :closable="!readOnly"
        @close="remove(idx)"
      >
        {{ keyword }}
      </el-tag>
      <input
        v-if="!readOnly"
        class="el-keywords-input"
        :placeholder="placeholder"
        :value="newKeyword"
        autocomplete="off"
        data-lpignore="true"
        @input="inputKeyword"
        @keydown.delete.stop="removeLastKeyword"
        @keydown="addNew"
        @blur="blur"
      />
    </div>
    <span
      class="text-xs text-gray-400"
      :class="focused ? 'opacity-100' : 'opacity-0'"
      >Press ENTER or comma (,) to separate keywords</span
    >
  </div>
</template>

<script>
export default {
  name: 'AppKeywordsInput',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    addKeywordOnKeys: {
      type: Array,
      default: () => [13, 188, 9]
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      newKeyword: '',
      innerKeywords: [...this.modelValue],
      focused: false
    }
  },
  watch: {
    modelValue() {
      this.innerKeywords = [...this.modelValue]
    }
  },
  methods: {
    focusKeywordInput() {
      if (
        this.readOnly ||
        !this.$el.querySelector('.el-keywords-input')
      ) {
        return
      } else {
        this.$el.querySelector('.el-keywords-input').focus()
        this.focused = true
      }
    },
    inputKeyword(ev) {
      this.newKeyword = ev.target.value
    },
    blur(e) {
      this.focused = false
      this.addNew(e)
    },
    addNew(e) {
      if (
        e &&
        !this.addKeywordOnKeys.includes(e.keyCode) &&
        e.type !== 'blur'
      ) {
        return
      }
      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }
      let addSuccess = false
      if (this.newKeyword.includes(',')) {
        this.newKeyword.split(',').forEach((item) => {
          if (this.addKeyword(item.trim())) {
            addSuccess = true
          }
        })
      } else {
        if (this.addKeyword(this.newKeyword.trim())) {
          addSuccess = true
        }
      }
      if (addSuccess) {
        this.keywordChange()
        this.newKeyword = ''
      }
    },
    addKeyword(keyword) {
      keyword = keyword.trim()
      if (
        keyword &&
        !this.innerKeywords.includes(keyword)
      ) {
        this.innerKeywords.push(keyword)
        return true
      }
      return false
    },
    remove(index) {
      this.innerKeywords.splice(index, 1)
      this.keywordChange()
    },
    removeLastKeyword() {
      if (this.newKeyword) {
        return
      }
      this.innerKeywords.pop()
      this.keywordChange()
    },
    keywordChange() {
      this.$emit('update:modelValue', this.innerKeywords)
    }
  }
}
</script>

<style lang="scss">
.el-keywords-input-wrapper {
  @apply relative text-sm bg-white rounded-md pr-2 pl-1 flex items-center flex-wrap;
  background-image: none;
  border: 1px solid #dcdfe6;
  box-sizing: content-box;
  color: #606266;
  outline: none;
  transition: border-color 0.2s
    cubic-bezier(0.645, 0.045, 0.355, 1);
  min-height: 38px;

  .el-tag {
    margin: 4px 0 4px 4px;
  }

  &.is-focus {
    border: 1px solid #0068bd;
  }
}

.el-keywords-input {
  @apply bg-transparent border-none pl-0 ml-2 h-full;
  font-size: inherit;
  outline: none;
  width: 200px;
  min-height: 24px;
}

.el-keywords-input-list {
  @apply flex items-center flex-wrap h-full;
}
</style>
